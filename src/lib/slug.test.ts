import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slug";

describe("slugify", () => {
  it.each([
    ["João & Maria", "joao-maria"],
    ["  Casamento   de Ana!  ", "casamento-de-ana"],
    ["Aniversário da Conceição", "aniversario-da-conceicao"],
    ["Festa 2027", "festa-2027"],
    ["🎉🎉", ""],
  ])("turns %j into %j", (text, expected) => {
    expect(slugify(text)).toBe(expected);
  });

  it("keeps long names under 60 characters, without a hyphen at the end", () => {
    const slug = slugify("a ".repeat(40));
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug).not.toMatch(/-$/);
  });
});
