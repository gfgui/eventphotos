import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminSkeleton } from "@/components/admin/admin-skeleton";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { format, formatEventDate } from "@/i18n/format";
import { listHostEvents } from "@/lib/host-events";
import { requireHost } from "@/lib/host-session";

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Events />
    </Suspense>
  );
}

async function Events() {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);
  const host = await requireHost(lang);
  const events = await listHostEvents(host.id);
  const text = dict.admin.events;

  const createLink = (
    <Link href={`/${lang}/admin/events/new`} className={buttonVariants()}>
      <PlusIcon data-icon="inline-start" />
      {text.create}
    </Link>
  );

  return (
    <AdminShell lang={lang} hostName={host.name} dict={dict}>
      {events.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>
              <h1>{text.emptyTitle}</h1>
            </EmptyTitle>
            <EmptyDescription>{text.emptyDescription}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{createLink}</EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {text.title}
            </h1>
            {createLink}
          </div>
          <ul className="mt-6 grid gap-3">
            {events.map((event) => (
              <li key={event.id}>
                <Link href={`/${lang}/admin/events/${event.id}`}>
                  <Card className="transition-colors hover:bg-muted/50">
                    <CardHeader>
                      <CardTitle>{event.name}</CardTitle>
                      <CardDescription>
                        {formatEventDate(event.date, lang)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-4 text-muted-foreground">
                      <span>
                        {format(text.guests, { count: event._count.guests })}
                      </span>
                      <span>
                        {format(text.photos, { count: event._count.media })}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </AdminShell>
  );
}
