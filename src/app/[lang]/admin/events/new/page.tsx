import { Suspense } from "react";
import { AdminShell, BackLink } from "@/components/admin/admin-shell";
import { AdminSkeleton } from "@/components/admin/admin-skeleton";
import { EventForm } from "@/components/admin/event-form";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { requireHost } from "@/lib/host-session";

export default function NewEventPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <NewEvent />
    </Suspense>
  );
}

async function NewEvent() {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);
  const host = await requireHost(lang);

  return (
    <AdminShell lang={lang} hostName={host.name} dict={dict}>
      <div className="max-w-lg">
        <BackLink href={`/${lang}/admin`}>{dict.admin.event.back}</BackLink>
        <h1 className="mt-3 mb-6 font-heading text-2xl font-semibold tracking-tight">
          {dict.admin.eventForm.newTitle}
        </h1>
        <EventForm lang={lang} dict={dict.admin.eventForm} />
      </div>
    </AdminShell>
  );
}
