import { z } from "zod";

/**
 * Themes a host can choose for an event, saved in Event.appearance, in the order the panel
 * lists them. "basic" is the shadcn default; the others come from the skeleton-ds design
 * systems. To add a theme, see "Themes" in the README.
 */
export const themeIds = ["basic", "essential", "heritage", "confetti"] as const;
export type ThemeId = (typeof themeIds)[number];

export const defaultThemeId: ThemeId = "basic";

/**
 * Fonts a host can choose for the titles of the guest pages: the bundled fonts of the themes,
 * plus Inter. "theme" keeps the one the theme picked. The text keeps the theme's font.
 */
export const headingFontIds = [
  "theme",
  "newsreader",
  "cormorant",
  "fraunces",
  "jost",
  "nunitoSans",
  "inter",
] as const;
export type HeadingFontId = (typeof headingFontIds)[number];

/** The variable of each font, declared in src/themes/fonts.ts. */
export const headingFontVariables: Record<
  Exclude<HeadingFontId, "theme">,
  string
> = {
  newsreader: "--font-newsreader",
  cormorant: "--font-cormorant-garamond",
  fraunces: "--font-fraunces",
  jost: "--font-jost",
  nunitoSans: "--font-nunito-sans",
  inter: "--font-inter",
};

/** What --heading-font becomes for a chosen font, or undefined to keep the theme's. */
export function headingFontValue(font: HeadingFontId) {
  return font === "theme" ? undefined : `var(${headingFontVariables[font]})`;
}

/** How the Photos tab lays out the photos: a cropped grid, one card per photo, or a wall. */
export const feedStyles = ["grid", "list", "wall"] as const;
export type FeedStyle = (typeof feedStyles)[number];

/** Shape of Event.appearance. Whatever hosts change must pass this schema before being saved. */
export const appearanceSchema = z.object({
  theme: z.enum(themeIds).default(defaultThemeId),
  headingFont: z.enum(headingFontIds).default("theme"),
  feedStyle: z.enum(feedStyles).default("grid"),
});
export type Appearance = z.infer<typeof appearanceSchema>;

// Field by field, so that one value the app no longer knows doesn't undo the others.
const savedAppearanceSchema = z.object({
  theme: z.enum(themeIds).catch(defaultThemeId),
  headingFont: z.enum(headingFontIds).catch("theme"),
  feedStyle: z.enum(feedStyles).catch("grid"),
});

/** Reads a saved appearance. It never fails, so a theme removed from the app can't break an event. */
export function parseAppearance(saved: unknown): Appearance {
  return savedAppearanceSchema.parse(
    saved && typeof saved === "object" ? saved : {},
  );
}
