import type { LikeState } from "@/components/gallery/like-button";

/** A published photo in the list or the wall, which show it in its own shape. */
export type FeedItem = {
  id: string;
  /** Null while there is nothing to show yet. */
  imageUrl: string | null;
  alt: string;
  /** The filter chosen when sending, applied on display and never to the file. */
  filter: string | null;
  /** Written by the guest when sending; null when there is none. */
  caption: string | null;
  /** Null until the worker has read the photo. */
  width: number | null;
  height: number | null;
  author: { name: string; avatar: string; roleName: string };
  /** Absent when tapping does nothing. */
  onPress?: () => void;
  like?: LikeState;
};

/**
 * The photo's own width / height, kept between two limits so that a panorama or a very tall
 * screenshot doesn't take over the feed. What is left out is cropped, not squeezed.
 */
export function aspectRatio(
  { width, height }: Pick<FeedItem, "width" | "height">,
  { widest, tallest }: { widest: number; tallest: number },
) {
  if (!width || !height) return "3 / 4";
  return String(Math.min(Math.max(width / height, tallest), widest));
}
