"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type Locale, localeNames, locales } from "@/i18n/config";

type Props = { current: Locale; label: string };

/** Links to the current page in each other language. */
export function LanguageSwitcher({ current, label }: Props) {
  const pathname = usePathname();
  const rest = pathname.slice(`/${current}`.length);

  return (
    <nav aria-label={label} className="mt-4 flex justify-center gap-4 text-sm">
      {locales.map((locale) =>
        locale === current ? (
          <span key={locale} aria-current="true" className="font-semibold">
            {localeNames[locale]}
          </span>
        ) : (
          // No prefetch: the proxy stores the language of each visited URL in a
          // cookie, and a prefetch would switch it without a click.
          <Link
            key={locale}
            href={`/${locale}${rest}`}
            hrefLang={locale}
            lang={locale}
            prefetch={false}
            className="text-foreground/70 underline underline-offset-4"
          >
            {localeNames[locale]}
          </Link>
        ),
      )}
    </nav>
  );
}
