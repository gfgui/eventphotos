"use client";

import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { canPreview } from "@/components/gallery/use-uploads";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dictionary } from "@/i18n/dictionaries/pt-BR";
import { format } from "@/i18n/format";
import { type FilterId, filterCss, filterIds } from "@/lib/filters";
import { maxCaptionLength } from "@/lib/upload-limits";

/** A temporary address for the photo, freed when the screen closes. */
function useObjectUrl(file: File | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file || !canPreview(file)) {
      setUrl(null);
      return;
    }
    const created = URL.createObjectURL(file);
    setUrl(created);
    return () => URL.revokeObjectURL(created);
  }, [file]);
  return url;
}

type Props = {
  /** The photos just picked. The filter and the description go for all of them. */
  files: File[];
  onSend: (choice: { filter: FilterId; caption: string }) => void;
  onCancel: () => void;
  dict: Dictionary["gallery"]["filters"];
};

/**
 * Between picking and sending: the first photo large, with the filter chosen, and every filter
 * on a small copy of it. Only CSS: the file sent is the one the guest picked.
 */
export function FilterStep({ files, onSend, onCancel, dict }: Props) {
  const [filter, setFilter] = useState<FilterId>("none");
  const [caption, setCaption] = useState("");
  const previewUrl = useObjectUrl(files[0]);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-[480px]"
      >
        <div className="relative aspect-[3/4] max-h-[55dvh] w-full bg-muted">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt=""
              fill
              unoptimized
              style={{ filter: filterCss(filter) }}
              className="object-contain"
            />
          ) : (
            <span className="absolute inset-0 grid place-content-center justify-items-center gap-2 p-6 text-center text-sm text-muted-foreground">
              <ImageIcon aria-hidden="true" className="size-6" />
              {dict.noPreview}
            </span>
          )}
        </div>

        <div className="grid gap-3 p-4">
          <div className="grid gap-1">
            <DialogTitle>{dict.title}</DialogTitle>
            <DialogDescription className="text-xs">
              {files.length > 1 &&
                `${format(dict.count, { count: files.length })} `}
              {dict.hint}
            </DialogDescription>
          </div>

          <fieldset className="-mx-4 flex min-w-0 gap-3 overflow-x-auto px-4 pb-1">
            <legend className="sr-only">{dict.title}</legend>
            {filterIds.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
                className="group grid shrink-0 justify-items-center gap-1 text-xs outline-none"
              >
                <span className="relative block size-16 overflow-hidden rounded-md bg-muted ring-offset-2 ring-offset-background group-focus-visible:ring-3 group-focus-visible:ring-ring/50 group-aria-pressed:ring-2 group-aria-pressed:ring-primary">
                  {previewUrl && (
                    <Image
                      src={previewUrl}
                      alt=""
                      fill
                      unoptimized
                      style={{ filter: filterCss(id) }}
                      className="object-cover"
                    />
                  )}
                </span>
                <span className="group-aria-pressed:font-semibold">
                  {dict.names[id]}
                </span>
              </button>
            ))}
          </fieldset>

          <div className="grid gap-2">
            <Label htmlFor="photo-caption">{dict.caption}</Label>
            <Input
              id="photo-caption"
              value={caption}
              onChange={(change) => setCaption(change.target.value)}
              placeholder={dict.captionPlaceholder}
              maxLength={maxCaptionLength}
              enterKeyHint="send"
              onKeyDown={(key) => {
                if (key.key === "Enter") onSend({ filter, caption });
              }}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              {dict.cancel}
            </Button>
            <Button type="button" onClick={() => onSend({ filter, caption })}>
              {dict.send}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
