import { notFound } from "next/navigation";
import { z } from "zod";
import { type Locale, locales } from "@/i18n/config";
import { db, isForeignKeyError } from "@/lib/db";
import { processedStatuses } from "@/lib/host-media";
import { slugify } from "@/lib/slug";
import {
  type Appearance,
  appearanceSchema,
  parseAppearance,
} from "@/themes/config";

// Events live right after the language in the URL, next to these.
const reservedSlugs = new Set([
  "admin",
  "api",
  ...locales.map((locale) => locale.toLowerCase()),
]);

/** The address of a new event. It never changes after that, because QR Codes get printed. */
async function findFreeSlug(name: string) {
  const base = slugify(name) || "event";
  const events = await db.event.findMany({
    where: { slug: { startsWith: base } },
    select: { slug: true },
  });
  const taken = new Set([...reservedSlugs, ...events.map(({ slug }) => slug)]);

  let slug = base;
  for (let number = 2; taken.has(slug); number++) slug = `${base}-${number}`;
  return slug;
}

export type EventData = {
  name: string;
  date: Date;
  /** In the order guests will see them. New roles have no id yet. */
  roles: { id?: string; name: string }[];
  /** Null lets each guest's phone choose the language. */
  guestLocale: Locale | null;
  /** Each ranking shows up in the guests' Podium tab. */
  likesRankingEnabled: boolean;
  uploadsRankingEnabled: boolean;
};

export function listHostEvents(hostId: string) {
  return db.event.findMany({
    where: { hosts: { some: { hostId } } },
    orderBy: { date: "desc" },
    select: {
      id: true,
      name: true,
      date: true,
      _count: {
        select: {
          guests: true,
          media: { where: { status: { in: processedStatuses } } },
        },
      },
    },
  });
}

/** An event of this host, or null for any other id, including another host's. */
export async function findHostEvent(hostId: string, eventId: string) {
  if (!z.uuid().safeParse(eventId).success) return null;

  return db.event.findFirst({
    where: { id: eventId, hosts: { some: { hostId } } },
    select: {
      id: true,
      slug: true,
      name: true,
      date: true,
      appearance: true,
      guestLocale: true,
      coverKey: true,
      likesRankingEnabled: true,
      uploadsRankingEnabled: true,
    },
  });
}

/** An event of this host. For any other id, including another host's, renders the 404 page. */
export async function getHostEvent(hostId: string, eventId: string) {
  const event = await findHostEvent(hostId, eventId);
  if (!event) notFound();
  return event;
}

/** Saves the parts of the appearance that changed and keeps the rest. */
export async function updateHostAppearance(
  hostId: string,
  eventId: string,
  changes: Partial<Appearance>,
) {
  const event = await getHostEvent(hostId, eventId);
  const appearance = appearanceSchema.parse({
    ...parseAppearance(event.appearance),
    ...changes,
  });
  await db.event.update({ where: { id: event.id }, data: { appearance } });
}

export type EditableRole = { id: string; name: string; inUse: boolean };

export async function listEditableRoles(
  eventId: string,
): Promise<EditableRole[]> {
  const roles = await db.role.findMany({
    where: { eventId },
    orderBy: { order: "asc" },
    select: { id: true, name: true, _count: { select: { guests: true } } },
  });
  return roles.map(({ id, name, _count }) => ({
    id,
    name,
    inUse: _count.guests > 0,
  }));
}

/** Guests can join as soon as the event exists. */
export async function createHostEvent(
  hostId: string,
  { roles, ...settings }: EventData,
) {
  return db.event.create({
    data: {
      ...settings,
      slug: await findFreeSlug(settings.name),
      status: "OPEN",
      hosts: { create: { hostId } },
      roles: {
        create: roles.map((role, order) => ({ name: role.name, order })),
      },
    },
    select: { id: true },
  });
}

/** Returns "invalid" or "role-in-use" without changing anything. */
export async function updateHostEvent(
  hostId: string,
  eventId: string,
  { roles, ...settings }: EventData,
) {
  const event = await getHostEvent(hostId, eventId);
  const current = await listEditableRoles(event.id);
  const currentIds = new Set(current.map((role) => role.id));
  const keptIds = roles.flatMap((role) => (role.id ? [role.id] : []));

  if (
    keptIds.some((id) => !currentIds.has(id)) ||
    new Set(keptIds).size !== keptIds.length
  ) {
    return "invalid";
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.event.update({ where: { id: event.id }, data: settings });
      await tx.role.deleteMany({
        where: { eventId: event.id, id: { notIn: keptIds } },
      });
      // Names are unique per event: two roles couldn't swap them one update at a time.
      for (const id of keptIds) {
        await tx.role.update({ where: { id }, data: { name: id } });
      }
      for (const [order, role] of roles.entries()) {
        if (role.id) {
          await tx.role.update({
            where: { id: role.id },
            data: { name: role.name, order },
          });
        } else {
          await tx.role.create({
            data: { eventId: event.id, name: role.name, order },
          });
        }
      }
    });
  } catch (error) {
    // A guest is using a role that was removed.
    if (isForeignKeyError(error)) return "role-in-use";
    throw error;
  }

  return listEditableRoles(event.id);
}
