export const locales = ["pt-BR", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pt-BR";

/** Remembers the language chosen in the switcher, for visits to unprefixed URLs such as the QR Code. */
export const localeCookie = "NEXT_LOCALE";

/** Each language is named in itself, so people can find theirs whatever the current one is. */
export const localeNames: Record<Locale, string> = {
  "pt-BR": "Português",
  en: "English",
};

export function hasLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/**
 * Picks the supported locale that best fits an Accept-Language header,
 * matching on the primary language ("pt-PT" and "pt" both get "pt-BR").
 */
export function matchLocale(acceptLanguage: string | null): Locale {
  const preferences = (acceptLanguage ?? "")
    .split(",")
    .map((entry) => {
      const [tag, ...params] = entry.trim().split(";");
      const q = params.find((param) => param.trim().startsWith("q="));
      return {
        language: tag.toLowerCase().split("-")[0],
        quality: q ? Number(q.trim().slice(2)) : 1,
      };
    })
    .filter(({ language, quality }) => language && quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const { language } of preferences) {
    const match = locales.find(
      (locale) => locale.toLowerCase().split("-")[0] === language,
    );
    if (match) return match;
  }
  return defaultLocale;
}
