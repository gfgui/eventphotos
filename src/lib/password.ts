import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// One of the scrypt settings OWASP recommends, chosen because it needs only 32 MB per
// check: the local mode has to run on modest hardware.
const cost = { N: 2 ** 15, r: 8, p: 3 };
const keyLength = 32;

type Cost = typeof cost;

function deriveKey(password: string, salt: Buffer, { N, r, p }: Cost) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(
      // The same password can arrive in different Unicode forms, depending on the keyboard.
      password.normalize("NFKC"),
      salt,
      keyLength,
      { N, r, p, maxmem: 256 * N * r },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}

/** Saves the cost with the hash, so it can be raised later without losing old passwords. */
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt, cost);
  return [
    "scrypt",
    cost.N,
    cost.r,
    cost.p,
    salt.toString("base64"),
    key.toString("base64"),
  ].join("$");
}

export async function verifyPassword(password: string, stored: string) {
  const [, N, r, p, salt, key] = stored.split("$");
  const actual = await deriveKey(password, Buffer.from(salt, "base64"), {
    N: Number(N),
    r: Number(r),
    p: Number(p),
  });
  return timingSafeEqual(actual, Buffer.from(key, "base64"));
}
