// How the Photos tab sorts the gallery. Pure functions: they run on the phone, which already
// has every photo of the event, and in the tests.

export const sortModes = ["hot", "top", "new"] as const;
export type SortMode = (typeof sortModes)[number];

/**
 * How fast "Em alta" forgets: a photo this much newer needs ten times fewer likes to tie.
 * Reddit uses 12.5 hours, but a party lasts a few, so it is tuned to hours.
 */
export const hotDecaySeconds = 2 * 60 * 60;

type Rankable = { likeCount: number; createdAt: string };

/** Reddit's "hot": the order of magnitude of the likes, plus how recent the photo is. */
export function hotScore({ likeCount, createdAt }: Rankable) {
  return (
    Math.log10(Math.max(likeCount, 1)) +
    Date.parse(createdAt) / 1000 / hotDecaySeconds
  );
}

const newestFirst = (a: Rankable, b: Rankable) =>
  Date.parse(b.createdAt) - Date.parse(a.createdAt);

const compare: Record<SortMode, (a: Rankable, b: Rankable) => number> = {
  hot: (a, b) => hotScore(b) - hotScore(a) || newestFirst(a, b),
  top: (a, b) => b.likeCount - a.likeCount || newestFirst(a, b),
  new: newestFirst,
};

/** A sorted copy of the photos. Ties go to the newest. */
export function sortPhotos<T extends Rankable>(photos: T[], mode: SortMode) {
  return [...photos].sort(compare[mode]);
}
