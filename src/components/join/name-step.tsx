import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import type { FormEvent } from "react";
import { EventMonogram } from "@/components/event-monogram";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/pt-BR";

type Props = {
  lang: Locale;
  eventName: string;
  eventDate: string;
  /** Null when the hosts haven't chosen a cover: the event's initials stand in for it. */
  coverUrl: string | null;
  name: string;
  onNameChange: (name: string) => void;
  onContinue: () => void;
  dict: Dictionary["join"];
  /** Absent when the hosts fixed the event's language: there is nothing to switch. */
  languageLabel?: string;
};

export function NameStep({
  lang,
  eventName,
  eventDate,
  coverUrl,
  name,
  onNameChange,
  onContinue,
  dict,
  languageLabel,
}: Props) {
  const isBlank = !name.trim();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isBlank) onContinue();
  }

  return (
    <div className="flex flex-1 flex-col justify-center py-10">
      {coverUrl ? (
        <div
          data-slot="event-cover"
          className="relative mb-8 aspect-[3/2] w-full overflow-hidden rounded-lg bg-muted"
        >
          <Image
            src={coverUrl}
            alt={dict.coverAlt}
            fill
            unoptimized
            loading="eager"
            fetchPriority="high"
            className="object-cover"
          />
        </div>
      ) : (
        <EventMonogram
          name={eventName}
          className="mb-9 text-center text-[54px] leading-none"
        />
      )}
      <form
        onSubmit={handleSubmit}
        className="text-center duration-300 animate-in fade-in slide-in-from-bottom-2"
      >
        <p
          data-slot="eyebrow"
          className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase"
        >
          {dict.welcome}
        </p>
        <h1
          data-slot="page-title"
          className="mt-2 font-heading text-4xl leading-none tracking-tight"
        >
          {eventName}
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">{eventDate}</p>

        <div className="mt-12 grid gap-2.5 text-left">
          <Label htmlFor="guest-name">{dict.nameLabel}</Label>
          <Input
            id="guest-name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder={dict.namePlaceholder}
            autoComplete="name"
            maxLength={80}
            className="h-12 px-3.5"
          />
        </div>
        <Button type="submit" disabled={isBlank} className="mt-4 h-12 w-full">
          {dict.continue}
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </form>
      {languageLabel && (
        <LanguageSwitcher current={lang} label={languageLabel} />
      )}
    </div>
  );
}
