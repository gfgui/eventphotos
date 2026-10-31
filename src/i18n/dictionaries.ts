import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { hasLocale, type Locale } from "./config";
import { en } from "./dictionaries/en";
import { type Dictionary, ptBR } from "./dictionaries/pt-BR";

const dictionaries: Record<Locale, Dictionary> = { "pt-BR": ptBR, en };

/** Locale of the current request, from the [lang] segment. Server Components only. */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!hasLocale(value)) notFound();
  return value;
}

export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()];
}
