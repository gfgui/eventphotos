import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { logOut } from "@/app/[lang]/admin/actions";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/pt-BR";

type ShellProps = {
  lang: Locale;
  hostName: string;
  dict: Dictionary;
  children: ReactNode;
};

/** The frame of every page of the panel behind the login. */
export function AdminShell({ lang, hostName, dict, children }: ShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <Link href={`/${lang}/admin`} className="font-medium">
            {dict.admin.panel}
          </Link>
          <div className="flex min-w-0 items-center gap-3">
            <span className="truncate text-sm text-muted-foreground">
              {hostName}
            </span>
            <form action={logOut.bind(null, lang)}>
              <Button type="submit" variant="ghost" size="sm">
                {dict.admin.signOut}
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        {children}
      </main>
      <footer className="pb-6">
        <LanguageSwitcher current={lang} label={dict.languageSwitcher.label} />
      </footer>
    </div>
  );
}

type AuthProps = {
  lang: Locale;
  title: string;
  description: string;
  languageLabel: string;
  children: ReactNode;
};

/** The frame of the login and of the first access. */
export function AdminAuthScreen({
  lang,
  title,
  description,
  languageLabel,
  children,
}: AuthProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            <h1>{title}</h1>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
      <LanguageSwitcher current={lang} label={languageLabel} />
    </main>
  );
}

export function BackLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeftIcon aria-hidden="true" className="size-4" />
      {children}
    </Link>
  );
}
