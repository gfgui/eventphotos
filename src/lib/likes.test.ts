import { beforeEach, describe, expect, it, vi } from "vitest";
import { setLike } from "@/lib/likes";

const mocks = vi.hoisted(() => ({
  db: {
    $transaction: vi.fn(),
    media: {
      findFirst: vi.fn(),
      update: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    like: { createMany: vi.fn(), deleteMany: vi.fn() },
  },
  getCurrentGuest: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/lib/guest-session", () => ({
  getCurrentGuest: mocks.getCurrentGuest,
}));

const like = { mediaId: "media-1", guestId: "guest-1" };

beforeEach(() => {
  mocks.db.$transaction.mockImplementation(
    (work: (tx: typeof mocks.db) => unknown) => work(mocks.db),
  );
  mocks.db.media.findFirst.mockResolvedValue({
    id: "media-1",
    eventId: "event-1",
    event: { status: "OPEN" },
  });
  mocks.getCurrentGuest.mockResolvedValue({ id: "guest-1" });
});

describe("setLike", () => {
  it("adds the like and one to the total", async () => {
    mocks.db.like.createMany.mockResolvedValue({ count: 1 });
    mocks.db.media.update.mockResolvedValue({ likeCount: 4 });

    expect(await setLike("media-1", true)).toEqual({
      liked: true,
      likeCount: 4,
    });
    expect(mocks.db.like.createMany).toHaveBeenCalledWith({
      data: [like],
      skipDuplicates: true,
    });
    expect(mocks.db.media.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { likeCount: { increment: 1 } } }),
    );
  });

  // A double tap, or two tabs: the key lets one row in, and only that one counts.
  it("counts a repeated like only once", async () => {
    mocks.db.like.createMany.mockResolvedValue({ count: 0 });
    mocks.db.media.findUniqueOrThrow.mockResolvedValue({ likeCount: 3 });

    expect(await setLike("media-1", true)).toEqual({
      liked: true,
      likeCount: 3,
    });
    expect(mocks.db.media.update).not.toHaveBeenCalled();
  });

  it("takes the like back and one from the total", async () => {
    mocks.db.like.deleteMany.mockResolvedValue({ count: 1 });
    mocks.db.media.update.mockResolvedValue({ likeCount: 2 });

    expect(await setLike("media-1", false)).toEqual({
      liked: false,
      likeCount: 2,
    });
    expect(mocks.db.like.deleteMany).toHaveBeenCalledWith({ where: like });
    expect(mocks.db.media.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { likeCount: { decrement: 1 } } }),
    );
  });

  it("leaves the total alone when there was no like to take back", async () => {
    mocks.db.like.deleteMany.mockResolvedValue({ count: 0 });
    mocks.db.media.findUniqueOrThrow.mockResolvedValue({ likeCount: 2 });

    await setLike("media-1", false);

    expect(mocks.db.media.update).not.toHaveBeenCalled();
  });

  it("only finds published photos", async () => {
    mocks.db.media.findFirst.mockResolvedValue(null);

    expect(await setLike("media-1", true)).toEqual({ error: "not-found" });
    expect(mocks.db.media.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "media-1", status: "PUBLISHED" },
      }),
    );
  });

  it("refuses whoever isn't a guest of the photo's event", async () => {
    mocks.getCurrentGuest.mockResolvedValue(null);

    expect(await setLike("media-1", true)).toEqual({ error: "unauthorized" });
    expect(mocks.getCurrentGuest).toHaveBeenCalledWith("event-1");
    expect(mocks.db.$transaction).not.toHaveBeenCalled();
  });

  it("keeps the likes as they were once the event is closed", async () => {
    mocks.db.media.findFirst.mockResolvedValue({
      id: "media-1",
      eventId: "event-1",
      event: { status: "CLOSED" },
    });

    expect(await setLike("media-1", true)).toEqual({ error: "closed" });
    expect(mocks.db.$transaction).not.toHaveBeenCalled();
  });
});
