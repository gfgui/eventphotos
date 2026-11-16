"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import {
  createEvent,
  type EventError,
  updateEvent,
} from "@/app/[lang]/admin/actions";
import {
  FormError,
  SubmitButton,
  TextField,
} from "@/components/admin/form-parts";
import { useAdminAction } from "@/components/admin/use-admin-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { hasLocale, type Locale, localeNames, locales } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/pt-BR";
import { format } from "@/i18n/format";

type Role = { id?: string; name: string; inUse: boolean };
type Row = Role & { key: number };

let lastRowKey = 0;
const toRow = (role: Role): Row => ({ ...role, key: ++lastRowKey });

type Props = {
  lang: Locale;
  /** Absent when creating a new event. */
  event?: {
    id: string;
    name: string;
    honorees: string[];
    date: string;
    roles: Role[];
    guestLocale: Locale | null;
    likesRankingEnabled: boolean;
    uploadsRankingEnabled: boolean;
  };
  dict: Dictionary["admin"]["eventForm"];
};

type Rankings = {
  likesRankingEnabled: boolean;
  uploadsRankingEnabled: boolean;
};

export function EventForm({ lang, event, dict }: Props) {
  const router = useRouter();
  const { error, isPending, run } = useAdminAction<EventError>();
  const [name, setName] = useState(event?.name ?? "");
  // Always two fields; the second is optional, and blanks are left out on saving.
  const [honorees, setHonorees] = useState(() => [
    event?.honorees[0] ?? "",
    event?.honorees[1] ?? "",
  ]);
  const [date, setDate] = useState(event?.date ?? "");
  // Null: each guest's phone chooses.
  const [guestLocale, setGuestLocale] = useState(event?.guestLocale ?? null);
  const [roles, setRoles] = useState<Row[]>(() =>
    (
      event?.roles ??
      dict.defaultRoles.map((role) => ({ name: role, inUse: false }))
    ).map(toRow),
  );
  // New events start with both rankings on, as the database does.
  const [rankings, setRankings] = useState<Rankings>({
    likesRankingEnabled: event?.likesRankingEnabled ?? true,
    uploadsRankingEnabled: event?.uploadsRankingEnabled ?? true,
  });
  const [isSaved, setIsSaved] = useState(false);

  function renameRole(key: number, roleName: string) {
    setRoles((rows) =>
      rows.map((row) => (row.key === key ? { ...row, name: roleName } : row)),
    );
  }

  function addRole() {
    setIsSaved(false);
    setRoles((rows) => [...rows, toRow({ name: "", inUse: false })]);
  }

  function removeRole(key: number) {
    setIsSaved(false);
    setRoles((rows) => rows.filter((row) => row.key !== key));
  }

  function handleSubmit(submitEvent: FormEvent) {
    submitEvent.preventDefault();
    setIsSaved(false);
    const input = {
      lang,
      name,
      honorees,
      date,
      roles: roles
        .filter((role) => role.name.trim())
        .map((role) => ({ id: role.id, name: role.name })),
      guestLocale,
      ...rankings,
    };

    run(async () => {
      if (!event) return createEvent(input);

      const result = await updateEvent(event.id, input);
      if ("error" in result) return result;
      setRoles(result.roles.map(toRow));
      setIsSaved(true);
      router.refresh();
      return {};
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      onChange={() => setIsSaved(false)}
      className="grid gap-6"
    >
      {error && <FormError>{dict.errors[error]}</FormError>}

      <TextField
        id="event-name"
        label={dict.name}
        placeholder={dict.namePlaceholder}
        value={name}
        onChange={(change) => setName(change.target.value)}
        required
        maxLength={120}
      />
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">{dict.honorees}</legend>
        <p className="text-xs text-muted-foreground">{dict.honoreesHint}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {honorees.map((honoree, index) => (
            <Input
              // Two fixed fields, which never move.
              key={dict.honoreePlaceholders[index]}
              aria-label={format(dict.honoree, { number: index + 1 })}
              placeholder={dict.honoreePlaceholders[index]}
              value={honoree}
              onChange={(change) =>
                setHonorees((current) =>
                  current.map((value, position) =>
                    position === index ? change.target.value : value,
                  ),
                )
              }
              maxLength={40}
            />
          ))}
        </div>
      </fieldset>
      <TextField
        id="event-date"
        type="date"
        label={dict.date}
        value={date}
        onChange={(change) => setDate(change.target.value)}
        required
      />
      <div className="grid gap-2">
        <Label htmlFor="guest-locale">{dict.guestLocale}</Label>
        <NativeSelect
          id="guest-locale"
          value={guestLocale ?? ""}
          onChange={(change) => {
            const { value } = change.target;
            setGuestLocale(hasLocale(value) ? value : null);
          }}
          aria-describedby="guest-locale-hint"
          className="w-full"
        >
          <NativeSelectOption value="">
            {dict.guestLocaleAuto}
          </NativeSelectOption>
          {locales.map((locale) => (
            <NativeSelectOption key={locale} value={locale} lang={locale}>
              {localeNames[locale]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <p id="guest-locale-hint" className="text-xs text-muted-foreground">
          {dict.guestLocaleHint}
        </p>
      </div>

      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">{dict.roles}</legend>
        <p className="text-xs text-muted-foreground">{dict.rolesHint}</p>
        {roles.map((role, index) => (
          <div key={role.key} className="flex items-center gap-2">
            <Input
              aria-label={format(dict.roleName, { number: index + 1 })}
              value={role.name}
              onChange={(change) => renameRole(role.key, change.target.value)}
              maxLength={60}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={format(dict.removeRole, { number: index + 1 })}
              disabled={role.inUse || roles.length === 1}
              onClick={() => removeRole(role.key)}
            >
              <Trash2Icon />
            </Button>
          </div>
        ))}
        {roles.some((role) => role.inUse) && (
          <p className="text-xs text-muted-foreground">{dict.roleInUse}</p>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={addRole}
          className="justify-self-start"
        >
          <PlusIcon data-icon="inline-start" />
          {dict.addRole}
        </Button>
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">{dict.rankings}</legend>
        <p className="text-xs text-muted-foreground">{dict.rankingsHint}</p>
        {(
          [
            ["likesRankingEnabled", dict.likesRanking],
            ["uploadsRankingEnabled", dict.uploadsRanking],
          ] as const
        ).map(([field, label]) => (
          <Label key={field} className="font-normal">
            <input
              type="checkbox"
              checked={rankings[field]}
              onChange={(change) =>
                setRankings((current) => ({
                  ...current,
                  [field]: change.target.checked,
                }))
              }
              className="size-4 accent-primary"
            />
            {label}
          </Label>
        ))}
      </fieldset>

      <div className="flex items-center gap-3">
        <SubmitButton isPending={isPending}>
          {event ? dict.save : dict.create}
        </SubmitButton>
        {isSaved && (
          <p role="status" className="text-sm text-muted-foreground">
            {dict.saved}
          </p>
        )}
      </div>
    </form>
  );
}
