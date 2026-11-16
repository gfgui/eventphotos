import { describe, expect, it, vi } from "vitest";
import { listArchiveFiles, originalFileName } from "@/lib/host-media";

const mocks = vi.hoisted(() => ({ findMany: vi.fn() }));

vi.mock("@/lib/env", () => ({ env: { S3_BUCKET: "media" } }));
vi.mock("@/lib/db", () => ({ db: { media: { findMany: mocks.findMany } } }));
vi.mock("@/lib/storage", () => ({ s3: { send: vi.fn() } }));

let lastKey = 0;

/** A processed photo, as the export's query returns it. */
function photo(
  guest: { id: string; name: string; role: string },
  mimeType = "image/jpeg",
) {
  return {
    guestId: guest.id,
    originalKey: `events/event-1/originals/${++lastKey}`,
    mimeType,
    sizeBytes: 1_000,
    createdAt: new Date("2027-02-04T22:00:00Z"),
    guest: { name: guest.name, role: { name: guest.role } },
  };
}

async function archivePaths(photos: ReturnType<typeof photo>[]) {
  mocks.findMany.mockResolvedValue(photos);
  const files = await listArchiveFiles("event-1");
  return files.map((file) => file.name);
}

describe("listArchiveFiles", () => {
  it("exports every photo the worker accepted, hidden ones included", async () => {
    await archivePaths([]);
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          eventId: "event-1",
          status: { in: ["PUBLISHED", "PENDING_APPROVAL", "HIDDEN"] },
        },
      }),
    );
  });

  it("puts each guest's photos in a folder by role, numbered", async () => {
    const ana = { id: "g1", name: "Ana", role: "Amigos" };
    const bruno = { id: "g2", name: "Bruno", role: "Família" };

    expect(
      await archivePaths([
        photo(ana),
        photo(bruno, "image/heic"),
        photo(ana, "image/png"),
      ]),
    ).toEqual([
      "Amigos/Ana/001.jpg",
      "Família/Bruno/001.heic",
      "Amigos/Ana/002.png",
    ]);
  });

  // Windows and macOS see "Ana" and "ANA" as the same folder.
  it("tells apart guests with the same name, whatever the case", async () => {
    expect(
      await archivePaths([
        photo({ id: "g1", name: "Ana", role: "Amigos" }),
        photo({ id: "g2", name: "ANA", role: "Amigos" }),
      ]),
    ).toEqual(["Amigos/Ana/001.jpg", "Amigos/ANA (2)/001.jpg"]);
  });

  it.each([
    ["../..", "Ana", "_/Ana/001.jpg"],
    ["Amigos", "CON", "Amigos/_CON/001.jpg"],
    ["Amigos", 'a/b\\c:d*e"f', "Amigos/a b c d e f/001.jpg"],
    ["Amigos", " Ana... ", "Amigos/Ana/001.jpg"],
    ["Amigos", "Ana\u0000\u0007", "Amigos/Ana/001.jpg"],
  ])(
    "keeps role %j and guest %j inside their folders, valid on Windows",
    async (role, name, path) => {
      expect(await archivePaths([photo({ id: "g1", name, role })])).toEqual([
        path,
      ]);
    },
  );
});

describe("originalFileName", () => {
  const mediaId = "0192f1e0-1c2d-7000-8000-00000000abcd";

  it("names the download after its author, in ASCII", () => {
    expect(originalFileName("Ana Lúcia", mediaId, "image/heic")).toBe(
      "ana-lucia-0000abcd.heic",
    );
  });

  it("does without the author when nothing of the name fits, and without a known type", () => {
    expect(originalFileName("🎉", mediaId, "image/x-unknown")).toBe(
      "0000abcd.bin",
    );
  });
});
