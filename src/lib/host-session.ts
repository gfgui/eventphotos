import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Locale } from "@/i18n/config";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { createSessionToken, hashSessionToken } from "@/lib/session-token";

const cookieName = "admin_session";
const sevenDays = 60 * 60 * 24 * 7;

/** The host signed in to the admin panel in this browser, if any. */
export const getCurrentHost = cache(async () => {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;

  const session = await db.hostSession.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    select: { expiresAt: true, host: { select: { id: true, name: true } } },
  });
  return session && session.expiresAt > new Date() ? session.host : null;
});

export async function hasHosts() {
  return (await db.host.count()) > 0;
}

/**
 * For the panel's pages and Server Actions. Whoever isn't signed in goes to the login, or to
 * the first access while there is no account yet.
 */
export async function requireHost(lang: Locale) {
  const host = await getCurrentHost();
  if (host) return host;
  redirect(`/${lang}/admin/${(await hasHosts()) ? "login" : "setup"}`);
}

/** Signs this browser in. Only available in Server Actions and Route Handlers. */
export async function startHostSession(hostId: string) {
  const { token, tokenHash } = createSessionToken();
  const now = Date.now();

  await db.hostSession.deleteMany({
    where: { hostId, expiresAt: { lte: new Date(now) } },
  });
  await db.hostSession.create({
    data: {
      hostId,
      tokenHash,
      expiresAt: new Date(now + sevenDays * 1000),
    },
  });

  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    // Never sent from another site, which rules out clickjacking and forged requests.
    sameSite: "strict",
    // Local mode runs over plain HTTP, where browsers would discard a secure cookie.
    secure: env.PUBLIC_URL.startsWith("https://"),
    path: "/",
    maxAge: sevenDays,
  });
}

/** Signs this browser out, on the server too. */
export async function endHostSession() {
  const store = await cookies();
  const token = store.get(cookieName)?.value;
  if (token) {
    await db.hostSession.deleteMany({
      where: { tokenHash: hashSessionToken(token) },
    });
  }
  store.delete(cookieName);
}
