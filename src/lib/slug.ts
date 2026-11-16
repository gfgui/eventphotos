/** Only a-z, 0-9 and hyphens: fits a URL and a file name as it is. */
export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 60)
    .replace(/^-|-$/g, "");
}
