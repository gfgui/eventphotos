"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Dictionary } from "@/i18n/dictionaries/pt-BR";
import { format } from "@/i18n/format";
import { filterCss } from "@/lib/filters";

type Props = {
  photo: {
    displayUrl: string | null;
    authorName: string;
    /** The filter chosen when sending, applied here and never to the file. */
    filter: string | null;
    /** Written by the guest when sending. */
    caption: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dict: Pick<Dictionary["gallery"], "photoBy" | "closeViewer">;
  /** More buttons, next to the one that closes the viewer. */
  actions?: ReactNode;
};

export function PhotoViewer({
  photo,
  open,
  onOpenChange,
  dict,
  actions,
}: Props) {
  if (!photo?.displayUrl) return null;
  const title = format(dict.photoBy, { name: photo.authorName });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-[480px]"
      >
        <div className="relative aspect-[3/4] max-h-[78dvh] w-full bg-muted">
          <Image
            src={photo.displayUrl}
            alt={title}
            fill
            unoptimized
            style={{ filter: filterCss(photo.filter) }}
            className="object-contain"
          />
        </div>
        <div className="flex items-center justify-between gap-5 p-4">
          <div className="grid min-w-0 gap-1">
            <DialogTitle className="truncate">{title}</DialogTitle>
            {photo.caption && (
              <DialogDescription className="text-sm break-words text-foreground">
                {photo.caption}
              </DialogDescription>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            {actions}
            <DialogClose render={<Button variant="outline" />}>
              {dict.closeViewer}
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
