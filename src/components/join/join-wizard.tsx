"use client";

import { unstable_rethrow } from "next/navigation";
import { useState, useTransition } from "react";
import { type JoinError, joinEvent } from "@/app/[lang]/[slug]/actions";
import { EventMonogram } from "@/components/event-monogram";
import { AvatarStep } from "@/components/join/avatar-step";
import { NameStep } from "@/components/join/name-step";
import { RoleStep } from "@/components/join/role-step";
import { StepProgress } from "@/components/join/step-progress";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/pt-BR";

const totalSteps = 3;

type Props = {
  lang: Locale;
  event: {
    slug: string;
    name: string;
    honorees: string[];
    date: string;
    coverUrl: string | null;
  };
  roles: { id: string; name: string }[];
  dict: Dictionary["join"];
  /** Absent when the hosts fixed the event's language: there is nothing to switch. */
  languageLabel?: string;
};

/** The guest's entry: name, role and avatar. The server only hears about it at the end. */
export function JoinWizard({ lang, event, roles, dict, languageLabel }: Props) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [roleId, setRoleId] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [error, setError] = useState<JoinError | null>(null);
  const [isJoining, startJoining] = useTransition();

  function join() {
    if (!roleId || !avatar) return;
    setError(null);
    startJoining(async () => {
      try {
        const result = await joinEvent({
          lang,
          slug: event.slug,
          name,
          roleId,
          avatar,
        });
        setError(result.error);
      } catch (cause) {
        // A successful join ends in a redirect, which reaches the client as an error.
        unstable_rethrow(cause);
        setError("network");
      }
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-6 pt-[max(24px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))]">
      {step === 1 ? (
        <NameStep
          lang={lang}
          eventName={event.name}
          honorees={event.honorees}
          eventDate={event.date}
          coverUrl={event.coverUrl}
          name={name}
          onNameChange={setName}
          onContinue={() => setStep(2)}
          dict={dict}
          languageLabel={languageLabel}
        />
      ) : (
        <>
          <EventMonogram
            event={event}
            className="mb-6 text-center text-4xl leading-none"
          />
          <StepProgress step={step} total={totalSteps} dict={dict} />
          {step === 2 ? (
            <RoleStep
              guestName={name}
              roles={roles}
              selected={roleId}
              onSelect={setRoleId}
              onBack={() => setStep(1)}
              onContinue={() => setStep(3)}
              dict={dict}
            />
          ) : (
            <AvatarStep
              selected={avatar}
              onSelect={setAvatar}
              onBack={() => setStep(2)}
              onEnter={join}
              isJoining={isJoining}
              error={error}
              dict={dict}
            />
          )}
        </>
      )}
    </main>
  );
}
