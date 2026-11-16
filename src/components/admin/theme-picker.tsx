"use client";

import { type CSSProperties, type FormEvent, useState } from "react";
import {
  type AppearanceError,
  updateAppearance,
} from "@/app/[lang]/admin/actions";
import { FormError, SubmitButton } from "@/components/admin/form-parts";
import { useAdminAction } from "@/components/admin/use-admin-action";
import { EventMonogram } from "@/components/event-monogram";
import { GuestAvatar } from "@/components/guest-avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/pt-BR";
import { avatarRefs } from "@/lib/avatars";
import { cn } from "@/lib/utils";
import {
  type Appearance,
  type FeedStyle,
  feedStyles,
  type HeadingFontId,
  headingFontIds,
  headingFontValue,
  type ThemeId,
  themeIds,
} from "@/themes/config";

type PreviewTexts = Pick<Dictionary["join"], "welcome" | "back" | "continue">;
type PreviewEvent = { name: string; date: string };

type Props = {
  lang: Locale;
  event: PreviewEvent & { id: string };
  /** The appearance saved for the event. */
  saved: Appearance;
  dict: Dictionary["admin"]["appearance"];
  previewTexts: PreviewTexts;
};

const optionClass =
  "cursor-pointer rounded-xl border transition has-checked:border-primary has-checked:ring-2 has-checked:ring-primary has-focus-visible:ring-3 has-focus-visible:ring-ring/50";

/** The --heading-font of a chosen font, for the previews. */
const fontStyle = (font: HeadingFontId) => {
  const value = headingFontValue(font);
  return value ? ({ "--heading-font": value } as CSSProperties) : undefined;
};

/** Theme, title font and feed style, each with a preview of what guests will see. */
export function ThemePicker({
  lang,
  event,
  saved: initiallySaved,
  dict,
  previewTexts,
}: Props) {
  const { error, isPending, run } = useAdminAction<AppearanceError>();
  const [appearance, setAppearance] = useState(initiallySaved);
  const [saved, setSaved] = useState(initiallySaved);
  const [isSaved, setIsSaved] = useState(false);

  function choose(changes: Partial<Appearance>) {
    setAppearance((current) => ({ ...current, ...changes }));
    setIsSaved(false);
  }

  function handleSubmit(submitEvent: FormEvent) {
    submitEvent.preventDefault();
    setIsSaved(false);
    run(async () => {
      const result = await updateAppearance(event.id, { lang, ...appearance });
      if (!result.error) {
        setSaved(appearance);
        setIsSaved(true);
      }
      return result;
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8">
      {error && <FormError>{dict.errors[error]}</FormError>}

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">{dict.theme}</legend>
        <p className="-mt-1 text-xs text-muted-foreground">{dict.themeHint}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {themeIds.map((id) => (
            <label key={id} className={cn("grid overflow-hidden", optionClass)}>
              <input
                type="radio"
                name="theme"
                value={id}
                checked={appearance.theme === id}
                onChange={() => choose({ theme: id })}
                aria-labelledby={`theme-${id}-name`}
                aria-describedby={
                  id === saved.theme
                    ? `theme-${id}-description theme-in-use`
                    : `theme-${id}-description`
                }
                className="sr-only"
              />
              <ThemePreview
                theme={id}
                headingFont={appearance.headingFont}
                event={event}
                texts={previewTexts}
              />
              <span className="flex items-start justify-between gap-3 border-t p-3">
                <span className="grid gap-0.5">
                  <span id={`theme-${id}-name`} className="text-sm font-medium">
                    {dict.themes[id].name}
                  </span>
                  <span
                    id={`theme-${id}-description`}
                    className="text-xs text-muted-foreground"
                  >
                    {dict.themes[id].description}
                  </span>
                </span>
                {id === saved.theme && (
                  <Badge id="theme-in-use" variant="secondary">
                    {dict.inUse}
                  </Badge>
                )}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">{dict.headingFont}</legend>
        <p className="-mt-1 text-xs text-muted-foreground">
          {dict.headingFontHint}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {headingFontIds.map((id) => (
            <label
              key={id}
              className={cn(
                "flex items-center justify-between gap-3 p-3",
                optionClass,
              )}
            >
              <input
                type="radio"
                name="heading-font"
                value={id}
                checked={appearance.headingFont === id}
                onChange={() => choose({ headingFont: id })}
                aria-label={dict.headingFonts[id]}
                className="sr-only"
              />
              {/* Under the theme chosen above, so "the theme's" shows its own font. */}
              <span
                aria-hidden="true"
                data-theme={appearance.theme}
                style={fontStyle(id)}
                className="min-w-0 truncate font-heading text-xl leading-tight"
              >
                {event.name}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {dict.headingFonts[id]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">{dict.feedStyle}</legend>
        <p className="-mt-1 text-xs text-muted-foreground">
          {dict.feedStyleHint}
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {feedStyles.map((id) => (
            <label key={id} className={cn("grid gap-3 p-3", optionClass)}>
              <input
                type="radio"
                name="feed-style"
                value={id}
                checked={appearance.feedStyle === id}
                onChange={() => choose({ feedStyle: id })}
                aria-labelledby={`feed-${id}-name`}
                aria-describedby={`feed-${id}-description`}
                className="sr-only"
              />
              <FeedSketch style={id} />
              <span className="grid gap-0.5">
                <span id={`feed-${id}-name`} className="text-sm font-medium">
                  {dict.feedStyles[id].name}
                </span>
                <span
                  id={`feed-${id}-description`}
                  className="text-xs text-muted-foreground"
                >
                  {dict.feedStyles[id].description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <SubmitButton isPending={isPending}>{dict.save}</SubmitButton>
        {isSaved && (
          <p role="status" className="text-sm text-muted-foreground">
            {dict.saved}
          </p>
        )}
      </div>
    </form>
  );
}

const previewAvatars = avatarRefs("casual").slice(0, 4);

type PreviewProps = {
  theme: ThemeId;
  headingFont: HeadingFontId;
  event: PreviewEvent;
  texts: PreviewTexts;
};

/**
 * A miniature of the welcome screen, drawn with the theme's own tokens and the same data-slot
 * hooks as the guest pages, so it shows exactly what the theme changes. Nothing in it is
 * interactive: the whole card selects the theme.
 */
function ThemePreview({ theme, headingFont, event, texts }: PreviewProps) {
  return (
    <span
      data-theme={theme}
      aria-hidden="true"
      style={fontStyle(headingFont)}
      className="grid gap-4 bg-background px-5 py-6 text-center font-sans text-foreground"
    >
      <EventMonogram name={event.name} className="text-3xl leading-none" />
      <span className="grid gap-1">
        <span
          data-slot="eyebrow"
          className="text-[10px] font-medium tracking-[0.16em] text-muted-foreground uppercase"
        >
          {texts.welcome}
        </span>
        <span
          data-slot="page-title"
          className="truncate font-heading text-2xl leading-tight tracking-tight"
        >
          {event.name}
        </span>
        <span className="text-[11px] text-muted-foreground">{event.date}</span>
      </span>
      <span className="flex justify-center gap-2">
        {previewAvatars.map((avatar) => (
          <GuestAvatar key={avatar} avatar={avatar} className="size-8" />
        ))}
      </span>
      <span className="flex gap-2.5">
        {/* Through cn, as Button does, so the variant's classes replace the base ones. */}
        <span
          data-slot="button"
          data-variant="outline"
          className={cn(buttonVariants({ variant: "outline" }), "h-9")}
        >
          {texts.back}
        </span>
        <span
          data-slot="button"
          data-variant="default"
          className={cn(buttonVariants(), "h-9 flex-1")}
        >
          {texts.continue}
        </span>
      </span>
    </span>
  );
}

const sketchTile = "rounded-[2px] bg-muted-foreground/25";
// Names for the six tiles of the grid's drawing, which never move.
const gridSketchTiles = ["a", "b", "c", "d", "e", "f"];

/** A small drawing of how each feed style lays the photos out. */
function FeedSketch({ style }: { style: FeedStyle }) {
  return (
    <span
      aria-hidden="true"
      className="block h-24 overflow-hidden rounded-md bg-muted p-2"
    >
      {style === "grid" && (
        <span className="grid grid-cols-3 gap-1">
          {gridSketchTiles.map((tile) => (
            <span key={tile} className={cn(sketchTile, "aspect-[3/4]")} />
          ))}
        </span>
      )}
      {style === "list" && (
        <span className="grid gap-1.5">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-muted-foreground/40" />
            <span className="h-1.5 w-12 rounded-full bg-muted-foreground/40" />
          </span>
          <span className={cn(sketchTile, "h-16")} />
        </span>
      )}
      {style === "wall" && (
        <span className="grid grid-cols-2 gap-1">
          <span className="grid gap-1">
            <span className={cn(sketchTile, "h-12")} />
            <span className={cn(sketchTile, "h-8")} />
          </span>
          <span className="grid gap-1">
            <span className={cn(sketchTile, "h-7")} />
            <span className={cn(sketchTile, "h-14")} />
          </span>
        </span>
      )}
    </span>
  );
}
