import { describe, expect, it } from "vitest";
import { hasLocale, matchLocale } from "@/i18n/config";

describe("matchLocale", () => {
  it.each([
    ["pt-BR,pt;q=0.9,en;q=0.8", "pt-BR"],
    ["en-US,en;q=0.9", "en"],
    // Any Portuguese gets Brazilian Portuguese.
    ["pt-PT", "pt-BR"],
    ["pt", "pt-BR"],
    // The first supported language, in order of preference.
    ["fr-FR,en;q=0.5", "en"],
    ["en;q=0.4,pt;q=0.6", "pt-BR"],
    // q=0 means "not this one".
    ["en;q=0, pt", "pt-BR"],
  ])("picks the best match for %j", (header, expected) => {
    expect(matchLocale(header)).toBe(expected);
  });

  it.each(["de-DE", "*", "", null])(
    "falls back to Portuguese for %j",
    (header) => {
      expect(matchLocale(header)).toBe("pt-BR");
    },
  );
});

describe("hasLocale", () => {
  it("accepts the supported locales, exactly as written", () => {
    expect(hasLocale("pt-BR")).toBe(true);
    expect(hasLocale("en")).toBe(true);
    expect(hasLocale("pt")).toBe(false);
    expect(hasLocale("EN")).toBe(false);
    expect(hasLocale("")).toBe(false);
  });
});
