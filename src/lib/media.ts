import type { MediaStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export type GalleryPhoto = {
  id: string;
  /** Null until the worker has created the versions. */
  thumbnailUrl: string | null;
  displayUrl: string | null;
  /** The filter chosen when sending, applied on display: the file is never filtered. */
  filter: string | null;
  authorName: string;
  authorAvatar: string;
  authorRole: string;
  isMine: boolean;
  status: MediaStatus;
  likeCount: number;
  likedByMe: boolean;
  /** An ISO date, so the phone can sort the photos. */
  createdAt: string;
  /** Null until the worker has read the photo. */
  width: number | null;
  height: number | null;
};

/** What a guest can see, newest first: every published photo, plus how their own are doing. */
export async function listGalleryPhotos(
  eventId: string,
  guestId: string,
): Promise<GalleryPhoto[]> {
  const media = await db.media.findMany({
    where: {
      eventId,
      OR: [
        { status: "PUBLISHED" },
        {
          guestId,
          status: { in: ["PROCESSING", "PENDING_APPROVAL", "FAILED"] },
        },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      guestId: true,
      status: true,
      displayKey: true,
      thumbnailKey: true,
      filter: true,
      likeCount: true,
      createdAt: true,
      width: true,
      height: true,
      guest: {
        select: { name: true, avatar: true, role: { select: { name: true } } },
      },
      // At most one row: the guest's own like.
      likes: { where: { guestId }, select: { guestId: true } },
    },
  });

  return media.map((item) => ({
    id: item.id,
    thumbnailUrl: item.thumbnailKey ? `/api/media/${item.id}/thumbnail` : null,
    displayUrl: item.displayKey ? `/api/media/${item.id}/display` : null,
    filter: item.filter,
    authorName: item.guest.name,
    authorAvatar: item.guest.avatar,
    authorRole: item.guest.role.name,
    isMine: item.guestId === guestId,
    status: item.status,
    likeCount: item.likeCount,
    likedByMe: item.likes.length > 0,
    createdAt: item.createdAt.toISOString(),
    width: item.width,
    height: item.height,
  }));
}
