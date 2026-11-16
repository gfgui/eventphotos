import { notFound } from "next/navigation";
import { cache } from "react";
import { hasLocale, type Locale } from "@/i18n/config";
import { db } from "@/lib/db";

/** The event behind a URL, loaded once per request. An unknown slug renders the 404 page. */
export const getEvent = cache(async (slug: string) => {
  const event = await db.event.findUnique({ where: { slug } });
  if (!event) notFound();
  return event;
});

/**
 * The language the hosts fixed for every guest page of the event, or null when each guest's
 * phone chooses it. A language the app no longer has counts as null, so the event still opens.
 */
export function fixedLocale({
  guestLocale,
}: {
  guestLocale: string | null;
}): Locale | null {
  return guestLocale && hasLocale(guestLocale) ? guestLocale : null;
}

/** The random part of a cover's key. A new cover gets a new one, so its address changes too. */
export function coverVersion(coverKey: string) {
  return coverKey.slice(coverKey.lastIndexOf("/") + 1).replace(/\.webp$/, "");
}

/** Where pages load the event's cover, or null when it has none. */
export function coverUrl({
  slug,
  coverKey,
}: {
  slug: string;
  coverKey: string | null;
}) {
  return coverKey
    ? `/api/events/${slug}/cover?v=${coverVersion(coverKey)}`
    : null;
}

export function listRoles(eventId: string) {
  return db.role.findMany({
    where: { eventId },
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });
}
