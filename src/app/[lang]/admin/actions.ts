"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { type Locale, locales } from "@/i18n/config";
import {
  authenticateHost,
  createFirstHost,
  isSetupCode,
} from "@/lib/host-auth";
import {
  createHostEvent,
  type EditableRole,
  type EventData,
  updateHostAppearance,
  updateHostEvent,
} from "@/lib/host-events";
import {
  endHostSession,
  requireHost,
  startHostSession,
} from "@/lib/host-session";
import { maxPasswordLength, minPasswordLength } from "@/lib/password-rules";
import { feedStyles, headingFontIds, themeIds } from "@/themes/config";

const langField = z.enum(locales);
const emailField = z.string().trim().toLowerCase().max(254).pipe(z.email());

const setupSchema = z.object({
  lang: langField,
  code: z.string().max(256),
  name: z.string().trim().min(1).max(80),
  email: emailField,
  password: z.string().min(minPasswordLength).max(maxPasswordLength),
  confirmation: z.string(),
});

type SetupInput = z.input<typeof setupSchema>;

export type SetupError = "invalid" | "code" | "mismatch" | "taken";

/** Creates the first account and signs it in. Only returns on failure. */
export async function setUpAdmin(
  input: SetupInput,
): Promise<{ error: SetupError }> {
  const parsed = setupSchema.safeParse(input);
  if (!parsed.success) return { error: "invalid" };
  const { lang, code, name, email, password, confirmation } = parsed.data;

  if (!isSetupCode(code)) return { error: "code" };
  if (password !== confirmation) return { error: "mismatch" };

  const hostId = await createFirstHost({ name, email, password });
  if (!hostId) return { error: "taken" };

  await startHostSession(hostId);
  redirect(`/${lang}/admin`);
}

const loginSchema = z.object({
  lang: langField,
  email: emailField,
  password: z.string().min(1).max(maxPasswordLength),
});

type LoginInput = z.input<typeof loginSchema>;

/** Only returns on failure. */
export async function logIn(input: LoginInput): Promise<{ error: "invalid" }> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { error: "invalid" };
  const { lang, email, password } = parsed.data;

  const hostId = await authenticateHost(email, password);
  if (!hostId) return { error: "invalid" };

  await startHostSession(hostId);
  redirect(`/${lang}/admin`);
}

export async function logOut(lang: Locale) {
  await endHostSession();
  redirect(`/${langField.parse(lang)}/admin/login`);
}

const eventSchema = z.object({
  lang: langField,
  name: z.string().trim().min(1).max(120),
  /** One or two short names. Blank fields are left out. */
  honorees: z
    .array(z.string().trim().max(40))
    .max(2)
    .transform((names) => names.filter(Boolean)),
  date: z.iso.date(),
  roles: z
    .array(
      z.object({
        id: z.uuid().optional(),
        name: z.string().trim().min(1).max(60),
      }),
    )
    .min(1)
    .max(30),
  /** Null lets each guest's phone choose the language. */
  guestLocale: langField.nullable(),
  likesRankingEnabled: z.boolean(),
  uploadsRankingEnabled: z.boolean(),
});

type EventInput = z.input<typeof eventSchema>;

export type EventError = "invalid" | "duplicateRole" | "roleInUse";

function readEvent(
  input: EventInput,
): { error: EventError } | { lang: Locale; data: EventData } {
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) return { error: "invalid" };

  const { lang, date, roles, ...rest } = parsed.data;
  const names = new Set(roles.map((role) => role.name.toLowerCase()));
  if (names.size !== roles.length) return { error: "duplicateRole" };

  return {
    lang,
    data: {
      ...rest,
      // A calendar day, the same in every time zone.
      date: new Date(`${date}T00:00:00.000Z`),
      roles,
    },
  };
}

/** Only returns on failure. */
export async function createEvent(
  input: EventInput,
): Promise<{ error: EventError }> {
  const event = readEvent(input);
  if ("error" in event) return event;

  const host = await requireHost(event.lang);
  const { id } = await createHostEvent(host.id, event.data);
  redirect(`/${event.lang}/admin/events/${id}`);
}

/** On success, returns the roles as saved: new ones now have an id. */
export async function updateEvent(
  eventId: string,
  input: EventInput,
): Promise<{ error: EventError } | { roles: EditableRole[] }> {
  const event = readEvent(input);
  if ("error" in event) return event;

  const host = await requireHost(event.lang);
  const roles = await updateHostEvent(host.id, eventId, event.data);

  if (roles === "invalid") return { error: "invalid" };
  if (roles === "role-in-use") return { error: "roleInUse" };
  return { roles };
}

const appearanceInputSchema = z.object({
  lang: langField,
  theme: z.enum(themeIds),
  headingFont: z.enum(headingFontIds),
  feedStyle: z.enum(feedStyles),
});

type AppearanceInput = z.input<typeof appearanceInputSchema>;

export type AppearanceError = "invalid";

/** Guests get the new appearance the next time they load a page. */
export async function updateAppearance(
  eventId: string,
  input: AppearanceInput,
): Promise<{ error?: AppearanceError }> {
  const parsed = appearanceInputSchema.safeParse(input);
  if (!parsed.success) return { error: "invalid" };
  const { lang, ...appearance } = parsed.data;

  const host = await requireHost(lang);
  await updateHostAppearance(host.id, eventId, appearance);
  return {};
}
