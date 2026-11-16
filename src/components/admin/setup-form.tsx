"use client";

import type { FormEvent } from "react";
import { type SetupError, setUpAdmin } from "@/app/[lang]/admin/actions";
import {
  FormError,
  SubmitButton,
  TextField,
} from "@/components/admin/form-parts";
import { useAdminAction } from "@/components/admin/use-admin-action";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/pt-BR";
import { format } from "@/i18n/format";
import { maxPasswordLength, minPasswordLength } from "@/lib/password-rules";

type Props = { lang: Locale; dict: Dictionary["admin"]["setup"] };

export function SetupForm({ lang, dict }: Props) {
  const { error, isPending, run } = useAdminAction<SetupError>();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const field = (name: string) => String(form.get(name));
    run(() =>
      setUpAdmin({
        lang,
        code: field("code"),
        name: field("name"),
        email: field("email"),
        password: field("password"),
        confirmation: field("confirmation"),
      }),
    );
  }

  return (
    // POST: if sent before the page finishes loading, a GET would put the password in the URL.
    <form method="post" onSubmit={handleSubmit} className="grid gap-4">
      {error && <FormError>{dict.errors[error]}</FormError>}
      <TextField
        id="setup-code"
        name="code"
        label={dict.code}
        hint={dict.codeHint}
        required
        autoComplete="off"
        spellCheck={false}
      />
      <TextField
        id="setup-name"
        name="name"
        label={dict.name}
        required
        maxLength={80}
        autoComplete="name"
      />
      <TextField
        id="setup-email"
        name="email"
        type="email"
        label={dict.email}
        required
        maxLength={254}
        autoComplete="username"
      />
      <TextField
        id="setup-password"
        name="password"
        type="password"
        label={dict.password}
        hint={format(dict.passwordHint, { min: minPasswordLength })}
        required
        minLength={minPasswordLength}
        maxLength={maxPasswordLength}
        autoComplete="new-password"
      />
      <TextField
        id="setup-confirmation"
        name="confirmation"
        type="password"
        label={dict.confirmation}
        required
        maxLength={maxPasswordLength}
        autoComplete="new-password"
      />
      <SubmitButton isPending={isPending} className="w-full">
        {dict.submit}
      </SubmitButton>
    </form>
  );
}
