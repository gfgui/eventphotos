import { createHash, randomBytes } from "node:crypto";

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Only the hash goes to the database; the token itself stays in the browser's cookie. */
export function createSessionToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashSessionToken(token) };
}
