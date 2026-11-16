import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminAuthScreen } from "@/components/admin/admin-shell";
import { AdminSkeleton } from "@/components/admin/admin-skeleton";
import { SetupForm } from "@/components/admin/setup-form";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { getCurrentHost, hasHosts } from "@/lib/host-session";

export default function SetupPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Setup />
    </Suspense>
  );
}

async function Setup() {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);

  if (await getCurrentHost()) redirect(`/${lang}/admin`);
  if (await hasHosts()) redirect(`/${lang}/admin/login`);

  return (
    <AdminAuthScreen
      lang={lang}
      title={dict.admin.setup.title}
      description={dict.admin.setup.description}
      languageLabel={dict.languageSwitcher.label}
    >
      <SetupForm lang={lang} dict={dict.admin.setup} />
    </AdminAuthScreen>
  );
}
