/** Fills the {placeholders} of a dictionary text. */
export function format(text: string, values: Record<string, string | number>) {
  return text.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match,
  );
}

/** Event dates are calendar days, kept at midnight UTC whatever the server's time zone. */
export function formatEventDate(date: Date, lang: string) {
  return new Intl.DateTimeFormat(lang, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
}

export function formatFileSize(bytes: number, lang: string) {
  const isLarge = bytes >= 1e9;
  return new Intl.NumberFormat(lang, {
    style: "unit",
    unit: isLarge ? "gigabyte" : "megabyte",
    maximumFractionDigits: 1,
  }).format(bytes / (isLarge ? 1e9 : 1e6));
}
