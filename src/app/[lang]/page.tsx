import { LanguageSwitcher } from "@/components/language-switcher";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

export default async function Home() {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-2xl font-semibold">{dict.home.title}</h1>
      <p className="text-foreground/70">{dict.home.scanQrCode}</p>
      <LanguageSwitcher current={locale} label={dict.languageSwitcher.label} />
    </main>
  );
}
