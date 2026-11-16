import { redirect } from "next/navigation";
import { Suspense } from "react";
import { EventSkeleton } from "@/components/event-skeleton";
import { JoinWizard } from "@/components/join/join-wizard";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { formatEventDate } from "@/i18n/format";
import { coverUrl, fixedLocale, getEvent, listRoles } from "@/lib/events";
import { getCurrentGuest } from "@/lib/guest-session";

type Props = PageProps<"/[lang]/[slug]">;

export default function JoinPage({ params }: Props) {
  return (
    <Suspense fallback={<EventSkeleton />}>
      <Join params={params} />
    </Suspense>
  );
}

async function Join({ params }: Pick<Props, "params">) {
  const { slug } = await params;
  const [event, lang, dict] = await Promise.all([
    getEvent(slug),
    getLocale(),
    getDictionary(),
  ]);

  const locale = fixedLocale(event);
  if (locale && locale !== lang) redirect(`/${locale}/${slug}`);

  if (await getCurrentGuest(event.id)) redirect(`/${lang}/${slug}/gallery`);

  if (event.status !== "OPEN") {
    return (
      <main className="flex min-h-dvh flex-col justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyTitle className="text-2xl">{event.name}</EmptyTitle>
            <EmptyDescription>{dict.join.errors.closed}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </main>
    );
  }

  return (
    <JoinWizard
      lang={lang}
      event={{
        slug: event.slug,
        name: event.name,
        date: formatEventDate(event.date, lang),
        coverUrl: coverUrl(event),
      }}
      roles={await listRoles(event.id)}
      dict={dict.join}
      languageLabel={locale ? undefined : dict.languageSwitcher.label}
    />
  );
}
