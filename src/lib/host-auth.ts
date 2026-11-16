import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { hashPassword, verifyPassword } from "@/lib/password";

const maxFailedLogins = 5;
const lockMilliseconds = 15 * 60 * 1000;
// Any number no other part of the app locks on.
const firstHostLock = 738_201;

const sha256 = (value: string) => createHash("sha256").update(value).digest();

export function isSetupCode(code: string) {
  return timingSafeEqual(sha256(code), sha256(env.ADMIN_SETUP_CODE));
}

/** Creates the account of the first access. Returns null if there is one already. */
export async function createFirstHost({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}) {
  const passwordHash = await hashPassword(password);

  const host = await db.$transaction(async (tx) => {
    // One first access at a time: if two arrive together, the second finds the first's account.
    await tx.$executeRaw`select pg_advisory_xact_lock(${firstHostLock})`;
    if ((await tx.host.count()) > 0) return null;
    return tx.host.create({
      data: { name, email, passwordHash },
      select: { id: true },
    });
  });
  return host?.id ?? null;
}

let decoyHash: Promise<string> | undefined;

/** Checked when there is no real password to check, so that every failure takes as long. */
function getDecoyHash() {
  decoyHash ??= hashPassword(randomBytes(32).toString("base64"));
  return decoyHash;
}

/** Counted before checking the password, so parallel requests can't get past the limit. */
async function takeLoginAttempt(hostId: string) {
  await db.host.updateMany({
    where: {
      id: hostId,
      lastFailedLoginAt: { lt: new Date(Date.now() - lockMilliseconds) },
    },
    data: { failedLogins: 0 },
  });
  const { count } = await db.host.updateMany({
    where: { id: hostId, failedLogins: { lt: maxFailedLogins } },
    data: { failedLogins: { increment: 1 }, lastFailedLoginAt: new Date() },
  });
  return count === 1;
}

/**
 * The id of the host with these credentials, or null. An unknown e-mail, a wrong password and
 * a blocked account look the same from outside.
 */
export async function authenticateHost(email: string, password: string) {
  const host = await db.host.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });
  const canTry = host ? await takeLoginAttempt(host.id) : false;
  const isCorrect = await verifyPassword(
    password,
    host && canTry ? host.passwordHash : await getDecoyHash(),
  );
  if (!host || !canTry || !isCorrect) return null;

  await db.host.update({
    where: { id: host.id },
    data: { failedLogins: 0, lastFailedLoginAt: null },
  });
  return host.id;
}
