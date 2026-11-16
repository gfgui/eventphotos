import { describe, expect, it, vi } from "vitest";
import { fixedLocale } from "@/lib/events";

// fixedLocale doesn't query anything, but its module loads the database client.
vi.mock("@/lib/db", () => ({ db: {} }));

describe("fixedLocale", () => {
  it("returns the language the hosts fixed", () => {
    expect(fixedLocale({ guestLocale: "en" })).toBe("en");
    expect(fixedLocale({ guestLocale: "pt-BR" })).toBe("pt-BR");
  });

  it("returns null when each guest's phone chooses", () => {
    expect(fixedLocale({ guestLocale: null })).toBeNull();
  });

  // A language removed from the app must not lock the event's pages.
  it("ignores a language the app doesn't have", () => {
    expect(fixedLocale({ guestLocale: "fr" })).toBeNull();
    expect(fixedLocale({ guestLocale: "" })).toBeNull();
  });
});
