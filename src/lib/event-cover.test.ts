import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { removeEventCover, saveEventCover } from "@/lib/event-cover";
import { maxPhotoBytes } from "@/lib/upload-limits";

const mocks = vi.hoisted(() => ({
  update: vi.fn(),
  send: vi.fn(),
}));

vi.mock("@/lib/env", () => ({ env: { S3_BUCKET: "media" } }));
vi.mock("@/lib/db", () => ({ db: { event: { update: mocks.update } } }));
vi.mock("@/lib/storage", () => ({ s3: { send: mocks.send } }));

const oldKey = "events/event-1/cover/old.webp";

/** What the bucket was asked to write and to delete. */
function storage() {
  const written = new Map<string, Buffer>();
  const deleted: string[] = [];
  mocks.send.mockImplementation(async (command: unknown) => {
    if (command instanceof PutObjectCommand) {
      written.set(String(command.input.Key), command.input.Body as Buffer);
    } else if (command instanceof DeleteObjectCommand) {
      deleted.push(String(command.input.Key));
    }
    return {};
  });
  return { written, deleted };
}

/** A phone photo, with camera details in the EXIF. */
async function photo(type = "image/jpeg") {
  const image = await sharp({
    create: { width: 3000, height: 2000, channels: 3, background: "#305080" },
  })
    .jpeg()
    .withExif({ IFD0: { Make: "TestPhone", Model: "Camera 1" } })
    .toBuffer();
  return new File([new Uint8Array(image)], "cover.jpg", { type });
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("saveEventCover", () => {
  it("saves a WebP of up to 1600 pixels, without EXIF", async () => {
    const { written } = storage();

    const result = await saveEventCover(
      { id: "event-1", coverKey: null },
      await photo(),
    );

    expect(result).toEqual({
      coverKey: expect.stringMatching(/^events\/event-1\/cover\/.+\.webp$/),
    });
    const [key, cover] = [...written][0];
    expect("coverKey" in result && result.coverKey).toBe(key);
    const { format, width, height, exif } = await sharp(cover).metadata();
    expect({ format, width, height, exif }).toEqual({
      format: "webp",
      width: 1600,
      height: 1067,
      exif: undefined,
    });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "event-1" },
      data: { coverKey: key },
    });
  });

  it("deletes the previous cover once the new one is saved", async () => {
    const { deleted } = storage();

    await saveEventCover({ id: "event-1", coverKey: oldKey }, await photo());

    expect(deleted).toEqual([oldKey]);
  });

  it.each([
    ["a type that isn't a photo", "image/svg+xml", "type"],
    ["a file that isn't an image", "image/jpeg", "unreadable"],
  ])("refuses %s", async (_name, type, error) => {
    const { written } = storage();
    const file = new File([new Uint8Array(1_000)], "cover", { type });

    const result = await saveEventCover(
      { id: "event-1", coverKey: null },
      file,
    );

    expect(result).toEqual({ error });
    expect(written.size).toBe(0);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("refuses a file over the size limit before reading it", async () => {
    storage();
    const file = await photo();
    Object.defineProperty(file, "size", { value: maxPhotoBytes + 1 });

    const result = await saveEventCover(
      { id: "event-1", coverKey: null },
      file,
    );

    expect(result).toEqual({ error: "size" });
  });
});

describe("removeEventCover", () => {
  it("clears the cover and deletes its file", async () => {
    const { deleted } = storage();

    await removeEventCover({ id: "event-1", coverKey: oldKey });

    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "event-1" },
      data: { coverKey: null },
    });
    expect(deleted).toEqual([oldKey]);
  });
});
