import { describe, expect, it } from "vitest";
import { en } from "@/i18n/dictionaries/en";
import { ptBR } from "@/i18n/dictionaries/pt-BR";

type Texts = Map<string, string>;

/** Every text of a dictionary, by its path, such as "join.stepProgress". */
function texts(value: unknown, path = "", found: Texts = new Map()): Texts {
  if (typeof value === "string") {
    found.set(path, value);
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      texts(child, path ? `${path}.${key}` : key, found);
    }
  }
  return found;
}

const placeholders = (text: string) =>
  [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

// The type check already makes en.ts have the same keys as pt-BR.ts. What it can't see is
// what is inside each text.
describe("dictionaries", () => {
  const portuguese = texts(ptBR);
  const english = texts(en);

  it("have the same placeholders in both languages", () => {
    for (const [path, text] of portuguese) {
      expect(placeholders(english.get(path) ?? ""), path).toEqual(
        placeholders(text),
      );
    }
  });

  it("have no empty text", () => {
    for (const [path, text] of [...portuguese, ...english]) {
      expect(text.trim(), path).not.toBe("");
    }
  });
});
