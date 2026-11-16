"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { locales } from "@/i18n/config";
import { isAvatarRef } from "@/lib/avatars";
import { db } from "@/lib/db";
import { getCurrentGuest, setGuestCookie } from "@/lib/guest-session";
import { createSessionToken } from "@/lib/session-token";

const joinSchema = z.object({
  lang: z.enum(locales),
  slug: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  roleId: z.uuid(),
  avatar: z.string().refine(isAvatarRef),
});

export type JoinInput = z.input<typeof joinSchema>;

/** Keys of dict.join.errors. "network" comes from the client, when the request fails. */
export type JoinError = "invalid" | "closed" | "network";

/** Creates the guest and starts their browser session. Only returns on failure. */
export async function joinEvent(
  input: JoinInput,
): Promise<{ error: JoinError }> {
  const parsed = joinSchema.safeParse(input);
  if (!parsed.success) return { error: "invalid" };
  const { lang, slug, name, roleId, avatar } = parsed.data;

  const event = await db.event.findUnique({ where: { slug } });
  if (event?.status !== "OPEN") return { error: "closed" };

  // Already signed in (a double tap or another tab): keep that guest.
  if (!(await getCurrentGuest(event.id))) {
    const role = await db.role.findFirst({
      where: { id: roleId, eventId: event.id },
      select: { id: true },
    });
    if (!role) return { error: "invalid" };

    const { token, tokenHash } = createSessionToken();
    await db.guest.create({
      data: { eventId: event.id, roleId: role.id, name, avatar, tokenHash },
    });
    await setGuestCookie(event.id, token);
  }

  redirect(`/${lang}/${slug}/gallery`);
}
