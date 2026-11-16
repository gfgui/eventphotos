import { DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { describe, expect, it, vi } from "vitest";
import { maxPhotoBytes } from "@/lib/upload-limits";
import {
  confirmUpload,
  getUploader,
  signRequestSchema,
  signUploadRequest,
} from "@/lib/uploads";

const mocks = vi.hoisted(() => ({
  db: {
    event: { findUnique: vi.fn() },
    media: {
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
  send: vi.fn(),
  getCurrentGuest: vi.fn(),
  enqueueMediaProcessing: vi.fn(),
}));

vi.mock("@/lib/env", () => ({ env: { S3_BUCKET: "media" } }));
vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/lib/storage", () => ({ s3: { send: mocks.send }, browserS3: {} }));
vi.mock("@/lib/guest-session", () => ({
  getCurrentGuest: mocks.getCurrentGuest,
}));
vi.mock("@/lib/media-worker", () => ({
  enqueueMediaProcessing: mocks.enqueueMediaProcessing,
}));
// Each URL names the command it signs, so a test can tell which one was signed.
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(
    async (_client: unknown, command: object) =>
      `https://storage.test/${command.constructor.name}`,
  ),
}));

const uploader = { eventId: "event-1", guestId: "guest-1" };
const originalKey = "events/event-1/originals/photo";

/** The guest's upload in progress, as the database has it. */
function upload(status = "UPLOADING") {
  mocks.db.media.findFirst.mockResolvedValue({
    id: "media-1",
    status,
    originalKey,
  });
}

/** What the storage holds under the original's key: its size, or nothing at all. */
function stored(size: number | null) {
  mocks.send.mockImplementation(async (command: unknown) => {
    if (!(command instanceof HeadObjectCommand)) return {};
    if (size === null) {
      throw Object.assign(new Error("No such key"), { name: "NotFound" });
    }
    return { ContentLength: size };
  });
}

describe("getUploader", () => {
  it("is the current guest of an open event", async () => {
    mocks.db.event.findUnique.mockResolvedValue({
      id: "event-1",
      status: "OPEN",
    });
    mocks.getCurrentGuest.mockResolvedValue({ id: "guest-1" });
    expect(await getUploader("joao-maria")).toEqual(uploader);
  });

  it("is nobody when the event is closed, or the browser isn't a guest", async () => {
    mocks.db.event.findUnique.mockResolvedValue({
      id: "event-1",
      status: "CLOSED",
    });
    mocks.getCurrentGuest.mockResolvedValue({ id: "guest-1" });
    expect(await getUploader("joao-maria")).toBeNull();

    mocks.db.event.findUnique.mockResolvedValue({
      id: "event-1",
      status: "OPEN",
    });
    mocks.getCurrentGuest.mockResolvedValue(null);
    expect(await getUploader("joao-maria")).toBeNull();
  });
});

describe("signRequestSchema", () => {
  // Uppy sends parts of 5 MiB, the smallest S3 accepts.
  const partsOfTheLargestPhoto = Math.ceil(maxPhotoBytes / (5 * 1024 * 1024));
  const part = (partNumber: number) => ({
    method: "PUT",
    key: originalKey,
    uploadId: "upload-1",
    partNumber,
  });

  it("allows just the parts the largest photo needs", () => {
    expect(
      signRequestSchema.safeParse(part(partsOfTheLargestPhoto)).success,
    ).toBe(true);
    expect(
      signRequestSchema.safeParse(part(partsOfTheLargestPhoto + 1)).success,
    ).toBe(false);
  });

  it("refuses requests that aren't steps of an upload", () => {
    expect(
      signRequestSchema.safeParse({ ...part(1), method: "PATCH" }).success,
    ).toBe(false);
  });
});

describe("starting an upload", () => {
  it("creates the media in the event's originals, owned by the guest", async () => {
    mocks.db.media.create.mockResolvedValue({ id: "media-1" });

    const started = await signUploadRequest(uploader, {
      method: "POST",
      // The guest can't choose where the file goes: the server picks the key.
      key: "events/other-event/originals/mine",
      file: { type: "image/jpeg", size: 3_000_000 },
    });

    expect(started).toMatchObject({
      url: "https://storage.test/CreateMultipartUploadCommand",
      mediaId: "media-1",
    });
    const key = started && "key" in started ? started.key : undefined;
    expect(key).toMatch(/^events\/event-1\/originals\/[\da-f-]{36}$/);
    expect(mocks.db.media.create).toHaveBeenCalledWith({
      data: {
        eventId: "event-1",
        guestId: "guest-1",
        source: "GALLERY",
        filter: null,
        originalKey: key,
        mimeType: "image/jpeg",
        sizeBytes: 3_000_000,
      },
      select: { id: true },
    });
  });

  // RNF04: the filter is saved as data, for the display; the file goes up untouched.
  it("saves the filter and where the photo came from", async () => {
    mocks.db.media.create.mockResolvedValue({ id: "media-1" });

    await signUploadRequest(uploader, {
      method: "POST",
      key: originalKey,
      file: {
        type: "image/jpeg",
        size: 3_000_000,
        filter: "vintage",
        source: "CAMERA",
      },
    });

    expect(mocks.db.media.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ filter: "vintage", source: "CAMERA" }),
      }),
    );
  });

  it("saves no filter for the original look", async () => {
    mocks.db.media.create.mockResolvedValue({ id: "media-1" });

    await signUploadRequest(uploader, {
      method: "POST",
      key: originalKey,
      file: { type: "image/jpeg", size: 3_000_000, filter: "none" },
    });

    expect(mocks.db.media.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ filter: null }),
      }),
    );
  });

  it("refuses a filter the app doesn't have", () => {
    const start = {
      method: "POST",
      key: originalKey,
      file: { type: "image/jpeg", size: 3_000_000, filter: "neon" },
    };
    expect(signRequestSchema.safeParse(start).success).toBe(false);
  });

  it.each([
    { type: "image/svg+xml", size: 1_000 },
    { type: "application/pdf", size: 1_000 },
    { type: "image/jpeg", size: maxPhotoBytes + 1 },
  ])("refuses $type with $size bytes", async (file) => {
    const started = await signUploadRequest(uploader, {
      method: "POST",
      key: originalKey,
      file,
    });
    expect(started).toBeNull();
    expect(mocks.db.media.create).not.toHaveBeenCalled();
  });
});

describe("the next steps of an upload", () => {
  it.each([
    { method: "PUT", partNumber: 3, command: "UploadPartCommand" },
    { method: "GET", partNumber: undefined, command: "ListPartsCommand" },
    {
      method: "POST",
      partNumber: undefined,
      command: "CompleteMultipartUploadCommand",
    },
  ] as const)(
    "signs $method for the guest's own upload",
    async ({ method, partNumber, command }) => {
      upload();
      const signed = await signUploadRequest(uploader, {
        method,
        key: originalKey,
        uploadId: "upload-1",
        partNumber,
      });

      expect(signed).toEqual({ url: `https://storage.test/${command}` });
      expect(mocks.db.media.findFirst).toHaveBeenCalledWith({
        where: { originalKey, eventId: "event-1", guestId: "guest-1" },
      });
    },
  );

  it("signs nothing for someone else's upload", async () => {
    mocks.db.media.findFirst.mockResolvedValue(null);
    const signed = await signUploadRequest(uploader, {
      method: "PUT",
      key: "events/event-1/originals/not-mine",
      uploadId: "upload-1",
      partNumber: 1,
    });
    expect(signed).toBeNull();
    expect(getSignedUrl).not.toHaveBeenCalled();
  });

  it("signs nothing once the file has been sent", async () => {
    upload("PROCESSING");
    const signed = await signUploadRequest(uploader, {
      method: "PUT",
      key: originalKey,
      uploadId: "upload-1",
      partNumber: 1,
    });
    expect(signed).toBeNull();
  });

  it("removes the media of a cancelled upload", async () => {
    upload();
    const signed = await signUploadRequest(uploader, {
      method: "DELETE",
      key: originalKey,
      uploadId: "upload-1",
    });
    expect(signed).toEqual({
      url: "https://storage.test/AbortMultipartUploadCommand",
    });
    expect(mocks.db.media.delete).toHaveBeenCalledWith({
      where: { id: "media-1" },
    });
  });
});

describe("confirmUpload", () => {
  it("sends the photo to be processed, with the size that actually arrived", async () => {
    upload();
    stored(2_000_000);
    mocks.db.media.updateMany.mockResolvedValue({ count: 1 });

    expect(await confirmUpload(uploader, originalKey)).toBe("confirmed");
    expect(mocks.db.media.updateMany).toHaveBeenCalledWith({
      where: { id: "media-1", status: "UPLOADING" },
      data: { status: "PROCESSING", sizeBytes: 2_000_000 },
    });
    expect(mocks.enqueueMediaProcessing).toHaveBeenCalledWith("media-1");
  });

  // A presigned URL can't limit the size, so it is checked after the fact.
  it("deletes a file larger than the limit", async () => {
    upload();
    stored(maxPhotoBytes + 1);

    expect(await confirmUpload(uploader, originalKey)).toBe("too-large");
    const deleted = mocks.send.mock.calls
      .map(([command]) => command)
      .find((command) => command instanceof DeleteObjectCommand);
    expect(deleted?.input).toEqual({ Bucket: "media", Key: originalKey });
    expect(mocks.db.media.update).toHaveBeenCalledWith({
      where: { id: "media-1" },
      data: { status: "FAILED" },
    });
    expect(mocks.enqueueMediaProcessing).not.toHaveBeenCalled();
  });

  it("can be called twice: the second time changes nothing", async () => {
    upload("PROCESSING");
    expect(await confirmUpload(uploader, originalKey)).toBe("confirmed");
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.enqueueMediaProcessing).not.toHaveBeenCalled();
  });

  it("queues the photo once when two confirmations arrive together", async () => {
    upload();
    stored(2_000_000);
    // The other request changed the status first.
    mocks.db.media.updateMany.mockResolvedValue({ count: 0 });

    expect(await confirmUpload(uploader, originalKey)).toBe("confirmed");
    expect(mocks.enqueueMediaProcessing).not.toHaveBeenCalled();
  });

  it("finds nothing for someone else's upload, or a file that never arrived", async () => {
    mocks.db.media.findFirst.mockResolvedValue(null);
    expect(await confirmUpload(uploader, originalKey)).toBe("not-found");

    upload();
    stored(null);
    expect(await confirmUpload(uploader, originalKey)).toBe("not-found");
  });
});
