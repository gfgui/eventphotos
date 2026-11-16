"use client";

import type { FormEvent } from "react";
import { logIn } from "@/app/[lang]/admin/actions";
import {
  FormError,
  SubmitButton,
  TextField,
} from "@/components/admin/form-parts";
import { useAdminAction } from "@/components/admin/use-admin-action";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/pt-BR";
import { maxPasswordLength } from "@/lib/password-rules";

type Props = { lang: Locale; dict: Dictionary["admin"]["login"] };

export function LoginForm({ lang, dict }: Props) {
  const { error, isPending, run } = useAdminAction<"invalid">();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    run(() =>
      logIn({
        lang,
        email: String(form.get("email")),
        password: String(form.get("password")),
      }),
    );
  }

  return (
    // POST: if sent before the page finishes loading, a GET would put the password in the URL.
    <form method="post" onSubmit={handleSubmit} className="grid gap-4">
      {error && <FormError>{dict.errors[error]}</FormError>}
      <TextField
        id="login-email"
        name="email"
        type="email"
        label={dict.email}
        required
        maxLength={254}
        autoComplete="username"
      />
      <TextField
        id="login-password"
        name="password"
        type="password"
        label={dict.password}
        required
        maxLength={maxPasswordLength}
        autoComplete="current-password"
      />
      <SubmitButton isPending={isPending} className="w-full">
        {dict.submit}
      </SubmitButton>
    </form>
  );
}
