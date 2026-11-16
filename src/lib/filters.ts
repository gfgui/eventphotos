import { z } from "zod";

/**
 * Filters a guest can choose before sending a photo. They are kept as data, in Media.filter,
 * and applied with CSS wherever the photo is shown: the file itself is never filtered. Their
 * names are in the dictionaries, under gallery.filters.names.
 */
export const filterIds = [
  "none",
  "mono",
  "warm",
  "cool",
  "vivid",
  "soft",
  "vintage",
] as const;
export type FilterId = (typeof filterIds)[number];

export const filterSchema = z.enum(filterIds);

const cssFilters: Record<FilterId, string | undefined> = {
  none: undefined,
  mono: "grayscale(1) contrast(1.1)",
  warm: "sepia(0.25) saturate(1.3) hue-rotate(-8deg)",
  cool: "saturate(0.9) hue-rotate(12deg) brightness(1.05)",
  vivid: "saturate(1.5) contrast(1.1)",
  soft: "contrast(0.9) brightness(1.08) saturate(0.9)",
  vintage: "sepia(0.5) contrast(0.95) brightness(1.05)",
};

/** The CSS of a saved filter. A name the app no longer knows shows the photo as it is. */
export function filterCss(filter: string | null | undefined) {
  const parsed = filterSchema.safeParse(filter);
  return parsed.success ? cssFilters[parsed.data] : undefined;
}

/** Where a photo came from, as the page tells it. Only for statistics: it can't be proven. */
export const uploadSources = ["CAMERA", "GALLERY"] as const;
export type UploadSource = (typeof uploadSources)[number];
