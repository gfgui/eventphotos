import { describe, expect, it } from "vitest";
import { hotDecaySeconds, hotScore, sortPhotos } from "@/lib/ranking";

const start = Date.parse("2026-11-20T20:00:00.000Z");

/** A photo sent `hours` after the start of the party. */
const photo = (id: string, likeCount: number, hours: number) => ({
  id,
  likeCount,
  createdAt: new Date(start + hours * 3600 * 1000).toISOString(),
});

const ids = (photos: { id: string }[]) => photos.map((item) => item.id);

describe("sortPhotos", () => {
  const photos = [
    photo("early-popular", 30, 0),
    photo("middle", 2, 1),
    photo("late-quiet", 0, 3),
  ];

  it("puts the newest first in Recentes", () => {
    expect(ids(sortPhotos(photos, "new"))).toEqual([
      "late-quiet",
      "middle",
      "early-popular",
    ]);
  });

  it("puts the most liked first in Mais curtidas, and the newest on a tie", () => {
    const tied = [...photos, photo("late-tied", 2, 2)];
    expect(ids(sortPhotos(tied, "top"))).toEqual([
      "early-popular",
      "late-tied",
      "middle",
      "late-quiet",
    ]);
  });

  it("gives a newer photo the same weight as ten times the likes, two hours earlier", () => {
    expect(hotDecaySeconds).toBe(2 * 3600);
    expect(hotScore(photo("new", 3, 2))).toBeCloseTo(
      hotScore(photo("old", 30, 0)),
    );
  });

  it("lets a recent photo with fewer likes pass an old popular one in Em alta", () => {
    const hot = sortPhotos(
      [photo("old", 30, 0), photo("recent", 4, 2), photo("newest", 0, 2.5)],
      "hot",
    );
    expect(ids(hot)).toEqual(["recent", "old", "newest"]);
  });

  it("counts a photo with no likes like one with a single like", () => {
    expect(hotScore(photo("none", 0, 1))).toBe(hotScore(photo("one", 1, 1)));
  });

  it("returns a sorted copy, without changing the list it got", () => {
    const before = ids(photos);
    sortPhotos(photos, "new");
    expect(ids(photos)).toEqual(before);
  });
});
