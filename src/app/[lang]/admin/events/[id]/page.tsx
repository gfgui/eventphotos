import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminSkeleton } from "@/components/admin/admin-skeleton";
import { CoverField } from "@/components/admin/cover-field";
import { EventForm } from "@/components/admin/event-form";
import { EventHeader } from "@/components/admin/event-header";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { coverUrl, fixedLocale } from "@/lib/events";
import { getHostEvent, listEditableRoles } from "@/lib/host-events";
import { requireHost } from "@/lib/host-session";

type Props = PageProps<"/[lang]/admin/events/[id]">;

export default function EventSettingsPage({ params }: Props) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <EventSettings params={params} />
    </Suspense>
  );
}

async function EventSettings({ params }: Pick<Props, "params">) {
  const { id } = await params;
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);
  const host = await requireHost(lang);
  const event = await getHostEvent(host.id, id);

  return (
    <AdminShell lang={lang} hostName={host.name} dict={dict}>
      <EventHeader
        lang={lang}
        event={event}
        current="settings"
        dict={dict.admin.event}
      />
      <div className="mt-6 grid max-w-lg gap-8">
        <CoverField
          eventId={event.id}
          coverUrl={coverUrl(event)}
          dict={dict.admin.cover}
        />
        <EventForm
          lang={lang}
          event={{
            id: event.id,
            name: event.name,
            honorees: event.honorees,
            date: event.date.toISOString().slice(0, 10),
            roles: await listEditableRoles(event.id),
            guestLocale: fixedLocale(event),
            likesRankingEnabled: event.likesRankingEnabled,
            uploadsRankingEnabled: event.uploadsRankingEnabled,
          }}
          dict={dict.admin.eventForm}
        />
      </div>
    </AdminShell>
  );
}
