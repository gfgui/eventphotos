"use client";

import { ImageIcon, Trash2Icon, UploadIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useRef, useState, useTransition } from "react";
import { FormError } from "@/components/admin/form-parts";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Dictionary } from "@/i18n/dictionaries/pt-BR";
import { format } from "@/i18n/format";
import type { CoverError } from "@/lib/event-cover";
import { allowedPhotoTypes, maxPhotoBytes } from "@/lib/upload-limits";

type Problem = CoverError | "network";

const coverErrors = new Set<string>(["type", "size", "unreadable"]);
const isCoverError = (value: unknown): value is CoverError =>
  typeof value === "string" && coverErrors.has(value);

type Props = {
  eventId: string;
  /** Null while the event has no cover. */
  coverUrl: string | null;
  dict: Dictionary["admin"]["cover"];
};

/** Sends, replaces or removes the cover right away, apart from the event's form. */
export function CoverField({ eventId, coverUrl, dict }: Props) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();
  const isBusy = isSending || isRefreshing;
  const url = `/api/admin/events/${eventId}/cover`;

  async function send(init: RequestInit) {
    setProblem(null);
    setIsSending(true);
    try {
      const response = await fetch(url, init);
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setProblem(isCoverError(body?.error) ? body.error : "network");
        return;
      }
      startRefresh(() => router.refresh());
    } catch {
      setProblem("network");
    } finally {
      setIsSending(false);
    }
  }

  function handlePick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!allowedPhotoTypes.includes(file.type)) return setProblem("type");
    if (file.size > maxPhotoBytes) return setProblem("size");

    const body = new FormData();
    body.set("file", file);
    send({ method: "POST", body });
  }

  return (
    <section aria-labelledby="cover-title" className="grid gap-3">
      <div className="grid gap-1">
        <h2 id="cover-title" className="text-sm font-medium">
          {dict.title}
        </h2>
        <p className="text-xs text-muted-foreground">{dict.hint}</p>
      </div>

      {problem && (
        <FormError>
          {format(dict.errors[problem], {
            max: maxPhotoBytes / (1024 * 1024),
          })}
        </FormError>
      )}

      <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg border bg-muted">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={dict.alt}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-muted-foreground">
            <ImageIcon aria-hidden="true" className="size-6" />
            <span className="sr-only">{dict.empty}</span>
          </span>
        )}
        {isBusy && (
          <span className="absolute inset-0 grid place-items-center bg-background/60">
            <Spinner />
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isBusy}
          onClick={() => input.current?.click()}
        >
          <UploadIcon data-icon="inline-start" />
          {coverUrl ? dict.change : dict.choose}
        </Button>
        {coverUrl && (
          <Button
            type="button"
            variant="ghost"
            disabled={isBusy}
            onClick={() => send({ method: "DELETE" })}
          >
            <Trash2Icon data-icon="inline-start" />
            {dict.remove}
          </Button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept={allowedPhotoTypes.join(",")}
        hidden
        onChange={handlePick}
      />
    </section>
  );
}
