import { describe, expect, it, vi } from "vitest";
import { getPodium } from "@/lib/podium";

const mocks = vi.hoisted(() => ({
  db: {
    media: { findMany: vi.fn(), groupBy: vi.fn() },
    guest: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/db", () => ({ db: mocks.db }));

const event = {
  id: "event-1",
  likesRankingEnabled: true,
  uploadsRankingEnabled: true,
};

describe("getPodium", () => {
  it("leaves out the rankings the hosts turned off", async () => {
    const podium = await getPodium({
      ...event,
      likesRankingEnabled: false,
      uploadsRankingEnabled: false,
    });

    expect(podium).toEqual({ photos: null, guests: null });
    expect(mocks.db.media.findMany).not.toHaveBeenCalled();
    expect(mocks.db.media.groupBy).not.toHaveBeenCalled();
  });

  it("lists the three most liked photos, the oldest first on a tie", async () => {
    mocks.db.media.findMany.mockResolvedValue([
      {
        id: "media-1",
        thumbnailKey: "thumb",
        likeCount: 7,
        guest: { name: "Ana" },
      },
    ]);
    mocks.db.media.groupBy.mockResolvedValue([]);
    mocks.db.guest.findMany.mockResolvedValue([]);

    const { photos } = await getPodium(event);

    expect(mocks.db.media.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          eventId: "event-1",
          status: "PUBLISHED",
          likeCount: { gt: 0 },
        },
        orderBy: [{ likeCount: "desc" }, { createdAt: "asc" }],
        take: 3,
      }),
    );
    expect(photos).toEqual([
      {
        id: "media-1",
        thumbnailUrl: "/api/media/media-1/thumbnail",
        authorName: "Ana",
        likeCount: 7,
      },
    ]);
  });

  it("keeps the guests in the order of their photo counts", async () => {
    mocks.db.media.findMany.mockResolvedValue([]);
    mocks.db.media.groupBy.mockResolvedValue([
      { guestId: "guest-2", _count: { _all: 5 } },
      { guestId: "guest-1", _count: { _all: 3 } },
    ]);
    // The database returns them in any order.
    mocks.db.guest.findMany.mockResolvedValue([
      {
        id: "guest-1",
        name: "Bia",
        avatar: "casual/1",
        role: { name: "Família" },
      },
      {
        id: "guest-2",
        name: "Caio",
        avatar: "discreet/2",
        role: { name: "Amigos" },
      },
    ]);

    const { guests } = await getPodium(event);

    expect(guests).toEqual([
      {
        id: "guest-2",
        name: "Caio",
        avatar: "discreet/2",
        roleName: "Amigos",
        photoCount: 5,
      },
      {
        id: "guest-1",
        name: "Bia",
        avatar: "casual/1",
        roleName: "Família",
        photoCount: 3,
      },
    ]);
  });
});
