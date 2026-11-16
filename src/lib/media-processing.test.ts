import { createHash, randomBytes } from "node:crypto";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";
import { processMedia } from "@/lib/media-processing";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  send: vi.fn(),
}));

vi.mock("@/lib/env", () => ({ env: { S3_BUCKET: "media" } }));
vi.mock("@/lib/db", () => ({
  db: { media: { findUnique: mocks.findUnique, update: mocks.update } },
}));
vi.mock("@/lib/storage", () => ({ s3: { send: mocks.send } }));

const originalKey = "events/event-1/originals/photo";
const displayKey = "events/event-1/display/media-1.webp";
const thumbnailKey = "events/event-1/thumbnails/media-1.webp";

/** A bucket that holds the original. Returns what the worker writes to it. */
function storage(original: Buffer) {
  const written = new Map<string, Buffer>();
  mocks.send.mockImplementation(async (command: unknown) => {
    if (command instanceof GetObjectCommand) {
      return {
        Body: { transformToByteArray: async () => new Uint8Array(original) },
      };
    }
    if (command instanceof PutObjectCommand) {
      written.set(String(command.input.Key), command.input.Body as Buffer);
      return {};
    }
    throw new Error(`Unexpected command: ${String(command)}`);
  });
  return written;
}

/** The media row, as the worker finds it. */
function media({ moderationMode = "HIDE_AFTER", status = "PROCESSING" } = {}) {
  mocks.findUnique.mockResolvedValue({
    id: "media-1",
    eventId: "event-1",
    status,
    originalKey,
    event: { moderationMode },
  });
}

/** A JPEG as phones save it: camera details in the EXIF, and maybe an orientation tag. */
async function phonePhoto(orientation?: number) {
  let image = sharp({
    create: { width: 2000, height: 1000, channels: 3, background: "#b04030" },
  })
    .jpeg()
    .withExif({ IFD0: { Make: "TestPhone", Model: "Camera 1" } });
  if (orientation) image = image.withMetadata({ orientation });
  return image.toBuffer();
}

const sizeOf = async (image: Buffer | undefined) => {
  const { width, height, format, exif } = await sharp(image).metadata();
  return { width, height, format, exif };
};

describe("processMedia", () => {
  it("writes versions without EXIF, and never touches the original", async () => {
    const original = await phonePhoto();
    // Otherwise the test would prove nothing.
    expect((await sizeOf(original)).exif).toBeDefined();
    const written = storage(original);
    media();

    await processMedia("media-1");

    expect([...written.keys()].sort()).toEqual([displayKey, thumbnailKey]);
    for (const version of written.values()) {
      const { format, exif } = await sizeOf(version);
      expect(format).toBe("webp");
      expect(exif).toBeUndefined();
    }
  });

  it("fits the versions in 1600 and 640 pixels", async () => {
    const written = storage(await phonePhoto());
    media();

    await processMedia("media-1");

    expect(await sizeOf(written.get(displayKey))).toMatchObject({
      width: 1600,
      height: 800,
    });
    expect(await sizeOf(written.get(thumbnailKey))).toMatchObject({
      width: 640,
      height: 320,
    });
  });

  // The EXIF goes away, so the rotation it asked for must already be in the pixels.
  it("turns the photo upright and saves the SHA-256 of the original", async () => {
    const original = await phonePhoto(6);
    const written = storage(original);
    media();

    await processMedia("media-1");

    expect(await sizeOf(written.get(displayKey))).toMatchObject({
      width: 800,
      height: 1600,
    });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "media-1" },
      data: {
        displayKey,
        thumbnailKey,
        width: 1000,
        height: 2000,
        sha256: createHash("sha256").update(original).digest("hex"),
        status: "PUBLISHED",
      },
    });
  });

  it("leaves the photo for the hosts when they approve first", async () => {
    storage(await phonePhoto());
    media({ moderationMode: "APPROVE_FIRST" });

    await processMedia("media-1");

    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "PENDING_APPROVAL" }),
      }),
    );
  });

  it.each(["png", "webp", "avif"] as const)(
    "reads %s photos",
    async (format) => {
      const original = await sharp({
        create: { width: 300, height: 200, channels: 3, background: "#204080" },
      })
        .toFormat(format)
        .toBuffer();
      const written = storage(original);
      media();

      await processMedia("media-1");

      expect(written.size).toBe(2);
    },
  );

  it.each([
    ["random bytes", randomBytes(4_000)],
    // sharp can read SVG, but it is a document that can carry links and scripts.
    [
      "an SVG",
      Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40"/></svg>',
      ),
    ],
  ])("marks %s as failed, without retrying", async (_name, original) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const written = storage(original);
    media();

    await processMedia("media-1");

    expect(written.size).toBe(0);
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "media-1" },
      data: { status: "FAILED" },
    });
  });

  it("does nothing for media that isn't waiting to be processed", async () => {
    media({ status: "PUBLISHED" });

    await processMedia("media-1");

    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
