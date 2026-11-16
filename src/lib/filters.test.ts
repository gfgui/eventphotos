import { describe, expect, it } from "vitest";
import { en } from "@/i18n/dictionaries/en";
import { ptBR } from "@/i18n/dictionaries/pt-BR";
import { filterCss, filterIds } from "@/lib/filters";

describe("filterCss", () => {
  it("shows the photo as it is without a filter", () => {
    expect(filterCss(null)).toBeUndefined();
    expect(filterCss("none")).toBeUndefined();
  });

  it.each(filterIds.filter((id) => id !== "none"))(
    "has a CSS filter for %s",
    (id) => {
      expect(filterCss(id)).toMatch(/^[a-z-]+\(.+\)/);
    },
  );

  // A filter removed from the app must not break the photos sent with it.
  it("ignores a filter it no longer knows", () => {
    expect(filterCss("sepia-plus")).toBeUndefined();
  });
});

describe("the filters' names", () => {
  it.each([
    ["pt-BR", ptBR],
    ["en", en],
  ])("are all in the %s dictionary", (_lang, dict) => {
    expect(Object.keys(dict.gallery.filters.names).sort()).toEqual(
      [...filterIds].sort(),
    );
  });
});
