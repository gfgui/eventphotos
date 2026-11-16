import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminSkeleton } from "@/components/admin/admin-skeleton";
import { EventHeader } from "@/components/admin/event-header";
import { ThemePicker } from "@/components/admin/theme-picker";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { formatEventDate } from "@/i18n/format";
import { getHostEvent } from "@/lib/host-events";
import { requireHost } from "@/lib/host-session";
import { parseAppearance } from "@/themes/config";

type Props = PageProps<"/[lang]/admin/events/[id]/appearance">;

export default function EventAppearancePage({ params }: Props) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <EventAppearance params={params} />
    </Suspense>
  );
}

async function EventAppearance({ params }: Pick<Props, "params">) {
  const { id } = await params;
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);
  const host = await requireHost(lang);
  const event = await getHostEvent(host.id, id);
  // Only the texts the previews show reach the browser.
  const { welcome, back, continue: next } = dict.join;

  return (
    <AdminShell lang={lang} hostName={host.name} dict={dict}>
      <EventHeader
        lang={lang}
        event={event}
        current="appearance"
        dict={dict.admin.event}
      />
      <div className="mt-6">
        <ThemePicker
          lang={lang}
          event={{
            id: event.id,
            name: event.name,
            honorees: event.honorees,
            date: formatEventDate(event.date, lang),
          }}
          saved={parseAppearance(event.appearance)}
          dict={dict.admin.appearance}
          previewTexts={{ welcome, back, continue: next }}
        />
      </div>
    </AdminShell>
  );
}
