import { db } from "@/lib/db";

const podiumSize = 3;

export type PodiumPhoto = {
  id: string;
  thumbnailUrl: string | null;
  filter: string | null;
  authorName: string;
  likeCount: number;
};

export type PodiumGuest = {
  id: string;
  name: string;
  avatar: string;
  roleName: string;
  photoCount: number;
};

/** Null for each ranking the hosts turned off. */
export type Podium = {
  photos: PodiumPhoto[] | null;
  guests: PodiumGuest[] | null;
};

type RankedEvent = {
  id: string;
  likesRankingEnabled: boolean;
  uploadsRankingEnabled: boolean;
};

/** The most liked photos. A tie goes to the photo that got there first. */
async function topPhotos(eventId: string): Promise<PodiumPhoto[]> {
  const media = await db.media.findMany({
    where: { eventId, status: "PUBLISHED", likeCount: { gt: 0 } },
    orderBy: [{ likeCount: "desc" }, { createdAt: "asc" }],
    take: podiumSize,
    select: {
      id: true,
      thumbnailKey: true,
      filter: true,
      likeCount: true,
      guest: { select: { name: true } },
    },
  });

  return media.map((item) => ({
    id: item.id,
    thumbnailUrl: item.thumbnailKey ? `/api/media/${item.id}/thumbnail` : null,
    filter: item.filter,
    authorName: item.guest.name,
    likeCount: item.likeCount,
  }));
}

/** The guests with the most published photos. A tie goes to whoever published first. */
async function topGuests(eventId: string): Promise<PodiumGuest[]> {
  const counts = await db.media.groupBy({
    by: ["guestId"],
    where: { eventId, status: "PUBLISHED" },
    _count: { _all: true },
    orderBy: [{ _count: { guestId: "desc" } }, { _min: { createdAt: "asc" } }],
    take: podiumSize,
  });

  const guests = await db.guest.findMany({
    where: { id: { in: counts.map((row) => row.guestId) } },
    select: {
      id: true,
      name: true,
      avatar: true,
      role: { select: { name: true } },
    },
  });
  const byId = new Map(guests.map((guest) => [guest.id, guest]));

  return counts.flatMap((row) => {
    const guest = byId.get(row.guestId);
    if (!guest) return [];
    return [
      {
        id: guest.id,
        name: guest.name,
        avatar: guest.avatar,
        roleName: guest.role.name,
        photoCount: row._count._all,
      },
    ];
  });
}

/** What the Podium tab shows: only the rankings the hosts left on. */
export async function getPodium(event: RankedEvent): Promise<Podium> {
  const [photos, guests] = await Promise.all([
    event.likesRankingEnabled ? topPhotos(event.id) : null,
    event.uploadsRankingEnabled ? topGuests(event.id) : null,
  ]);
  return { photos, guests };
}
