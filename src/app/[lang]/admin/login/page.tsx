import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminAuthScreen } from "@/components/admin/admin-shell";
import { AdminSkeleton } from "@/components/admin/admin-skeleton";
import { LoginForm } from "@/components/admin/login-form";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { getCurrentHost, hasHosts } from "@/lib/host-session";

export default function LoginPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Login />
    </Suspense>
  );
}

async function Login() {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);

  if (await getCurrentHost()) redirect(`/${lang}/admin`);
  if (!(await hasHosts())) redirect(`/${lang}/admin/setup`);

  return (
    <AdminAuthScreen
      lang={lang}
      title={dict.admin.login.title}
      description={dict.admin.login.description}
      languageLabel={dict.languageSwitcher.label}
    >
      <LoginForm lang={lang} dict={dict.admin.login} />
    </AdminAuthScreen>
  );
}
