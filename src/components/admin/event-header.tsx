import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { BackLink } from "@/components/admin/admin-shell";
import { TextField } from "@/components/admin/form-parts";
import { buttonVariants } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/pt-BR";
import { formatEventDate } from "@/i18n/format";
import { env } from "@/lib/env";

type Props = {
  lang: Locale;
  event: { id: string; slug: string; name: string; date: Date };
  current: (typeof tabs)[number]["id"];
  dict: Dictionary["admin"]["event"];
};

/** The pages of an event, by their path after /admin/events/<id>. */
const tabs = [
  { id: "settings", path: "" },
  { id: "appearance", path: "/appearance" },
  { id: "photos", path: "/photos" },
] as const;

const tabClass =
  "-mb-px border-b-2 px-3 py-2 text-sm font-medium border-transparent text-muted-foreground hover:text-foreground aria-[current=page]:border-foreground aria-[current=page]:text-foreground";

/** What the pages of an event share: its name, the guests' link and the tabs. */
export function EventHeader({ lang, event, current, dict }: Props) {
  const eventPath = `/${lang}/admin/events/${event.id}`;
  const guestUrl = `${env.PUBLIC_URL}/${event.slug}`;

  return (
    <div className="grid gap-6">
      <div className="grid justify-items-start gap-1">
        <BackLink href={`/${lang}/admin`}>{dict.back}</BackLink>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
          {event.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {formatEventDate(event.date, lang)}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
        <TextField
          id="guest-link"
          label={dict.guestLink}
          value={guestUrl}
          readOnly
        />
        <a
          href={guestUrl}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants()}
        >
          <ExternalLinkIcon data-icon="inline-start" />
          {dict.openAsGuest}
        </a>
      </div>

      <nav className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={`${eventPath}${tab.path}`}
            aria-current={current === tab.id ? "page" : undefined}
            className={tabClass}
          >
            {dict[tab.id]}
          </Link>
        ))}
      </nav>
    </div>
  );
}
