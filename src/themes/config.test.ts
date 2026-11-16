import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  defaultThemeId,
  headingFontValue,
  headingFontVariables,
  parseAppearance,
  themeIds,
} from "@/themes/config";

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

const defaults = {
  theme: defaultThemeId,
  headingFont: "theme",
  feedStyle: "grid",
};

describe("parseAppearance", () => {
  it("reads a saved appearance", () => {
    expect(
      parseAppearance({
        theme: "confetti",
        headingFont: "fraunces",
        feedStyle: "wall",
      }),
    ).toEqual({
      theme: "confetti",
      headingFont: "fraunces",
      feedStyle: "wall",
    });
  });

  // Events saved before the title font and the feed style existed.
  it("fills in what an older event didn't save", () => {
    expect(parseAppearance({ theme: "confetti" })).toEqual({
      ...defaults,
      theme: "confetti",
    });
  });

  it("drops what the schema doesn't know", () => {
    expect(parseAppearance({ theme: "heritage", css: "body{}" })).toEqual({
      ...defaults,
      theme: "heritage",
    });
  });

  // A theme removed from the app, or broken data, must never keep an event from opening.
  it.each([{}, null, "confetti", { theme: "neon" }])(
    "falls back to the defaults for %j",
    (saved) => {
      expect(parseAppearance(saved)).toEqual(defaults);
    },
  );

  it("keeps the other choices when one of them is no longer known", () => {
    expect(
      parseAppearance({ theme: "heritage", headingFont: "comic-sans" }),
    ).toEqual({ ...defaults, theme: "heritage" });
  });
});

describe("headingFontValue", () => {
  it("keeps the theme's own font", () => {
    expect(headingFontValue("theme")).toBeUndefined();
  });

  it("points to the variable of the chosen font", () => {
    expect(headingFontValue("fraunces")).toBe("var(--font-fraunces)");
  });

  // The type check can't see the variables next/font declares.
  it.each(Object.values(headingFontVariables))(
    "finds %s declared in fonts.ts",
    (variable) => {
      expect(read("./fonts.ts")).toContain(`variable: "${variable}"`);
    },
  );
});

// The steps of "Themes" in the README that the type check can't verify.
describe.each(themeIds.filter((id) => id !== "basic"))("the %s theme", (id) => {
  it("overrides the tokens under its data-theme attribute", () => {
    expect(read(`./${id}.css`)).toContain(`[data-theme="${id}"] {`);
  });

  it("is imported by globals.css", () => {
    expect(read("../app/globals.css")).toContain(
      `@import "../themes/${id}.css";`,
    );
  });
});
