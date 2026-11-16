"use client";

import { useState } from "react";

type Likeable = { id: string; likeCount: number; likedByMe: boolean };

/**
 * Likes as the guest sees them right after a tap, before the server answers. Only the wish is
 * kept: the total is worked out from the server's numbers, so a refreshed gallery that already
 * has the like doesn't count it twice.
 */
export function useLikes() {
  const [wishes, setWishes] = useState(new Map<string, boolean>());
  const [pending, setPending] = useState(new Set<string>());
  const [failed, setFailed] = useState(false);

  const isLiked = (photo: Likeable) => wishes.get(photo.id) ?? photo.likedByMe;

  function countOf(photo: Likeable) {
    const liked = isLiked(photo);
    if (liked === photo.likedByMe) return photo.likeCount;
    return Math.max(photo.likeCount + (liked ? 1 : -1), 0);
  }

  function setWish(id: string, liked: boolean | undefined) {
    setWishes((current) => {
      const next = new Map(current);
      if (liked === undefined) next.delete(id);
      else next.set(id, liked);
      return next;
    });
  }

  function setPendingFor(id: string, isPending: boolean) {
    setPending((current) => {
      const next = new Set(current);
      if (isPending) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function toggle(photo: Likeable) {
    if (pending.has(photo.id)) return;
    const previous = wishes.get(photo.id);
    const liked = !isLiked(photo);

    setFailed(false);
    setWish(photo.id, liked);
    setPendingFor(photo.id, true);
    try {
      const response = await fetch(`/api/media/${photo.id}/like`, {
        method: liked ? "PUT" : "DELETE",
      });
      if (!response.ok) throw new Error(`Status ${response.status}`);
    } catch {
      setWish(photo.id, previous);
      setFailed(true);
    } finally {
      setPendingFor(photo.id, false);
    }
  }

  return {
    isLiked,
    countOf,
    toggle,
    isPending: (id: string) => pending.has(id),
    /** The last tap couldn't be saved, and the heart went back to how it was. */
    failed,
  };
}
