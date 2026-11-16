import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSessionToken, hashSessionToken } from "@/lib/session-token";

describe("passwords", () => {
  it("accepts the right password and refuses any other", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("correct horse batterY", hash)).toBe(false);
  });

  it("saves the scrypt cost with the hash, and a new salt every time", async () => {
    const [first, second] = await Promise.all([
      hashPassword("same password"),
      hashPassword("same password"),
    ]);
    expect(first).toMatch(/^scrypt\$32768\$8\$3\$/);
    expect(first).not.toBe(second);
  });

  // Keyboards can type the same character in different Unicode forms.
  it("treats equivalent Unicode forms as the same password", async () => {
    const hash = await hashPassword("ﬁrst café");
    expect(await verifyPassword("first café", hash)).toBe(true);
  });
});

describe("session tokens", () => {
  it("keeps only the hash of the token", () => {
    const { token, tokenHash } = createSessionToken();
    expect(token).toMatch(/^[\w-]{43}$/);
    expect(tokenHash).toBe(hashSessionToken(token));
    expect(tokenHash).not.toContain(token);
  });
});
