import { db } from "@/lib/db";
import { getCurrentGuest } from "@/lib/guest-session";

export type LikeResult =
  | { liked: boolean; likeCount: number }
  | { error: "not-found" | "unauthorized" | "closed" };

/**
 * Likes or unlikes a published photo for the guest signed in to its event. Safe to repeat: the
 * (media, guest) key keeps one like per guest, and the total only moves when a row comes or
 * goes, so it stays right however many guests tap at the same time.
 */
export async function setLike(
  mediaId: string,
  liked: boolean,
): Promise<LikeResult> {
  const media = await db.media.findFirst({
    where: { id: mediaId, status: "PUBLISHED" },
    select: { id: true, eventId: true, event: { select: { status: true } } },
  });
  if (!media) return { error: "not-found" };

  const guest = await getCurrentGuest(media.eventId);
  if (!guest) return { error: "unauthorized" };
  // Like the uploads: once the party is over, the rankings stay as they ended.
  if (media.event.status !== "OPEN") return { error: "closed" };

  const like = { mediaId: media.id, guestId: guest.id };
  return db.$transaction(async (tx) => {
    const { count } = liked
      ? await tx.like.createMany({ data: [like], skipDuplicates: true })
      : await tx.like.deleteMany({ where: like });

    const { likeCount } =
      count === 1
        ? await tx.media.update({
            where: { id: media.id },
            data: {
              likeCount: liked ? { increment: 1 } : { decrement: 1 },
            },
            select: { likeCount: true },
          })
        : await tx.media.findUniqueOrThrow({
            where: { id: media.id },
            select: { likeCount: true },
          });

    return { liked, likeCount };
  });
}
