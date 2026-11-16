import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { hashSessionToken } from "@/lib/session-token";

// Guests have no password: this cookie is their identity. It outlasts the party so
// they can come back to the photos, and each event has its own.
const ninetyDays = 60 * 60 * 24 * 90;

function cookieName(eventId: string) {
  return `guest_${eventId}`;
}

/** The guest signed in to this event in the current browser, if any. */
export const getCurrentGuest = cache(async (eventId: string) => {
  const token = (await cookies()).get(cookieName(eventId))?.value;
  if (!token) return null;

  return db.guest.findFirst({
    where: { eventId, tokenHash: hashSessionToken(token) },
    include: { role: { select: { name: true } } },
  });
});

/** Starts the browser session. Only available in Server Actions and Route Handlers. */
export async function setGuestCookie(eventId: string, token: string) {
  (await cookies()).set(cookieName(eventId), token, {
    httpOnly: true,
    sameSite: "lax",
    // Local mode runs over plain HTTP, where browsers would discard a secure cookie.
    secure: env.PUBLIC_URL.startsWith("https://"),
    path: "/",
    maxAge: ninetyDays,
  });
}
