"use client";

import { DownloadIcon } from "lucide-react";
import { useState } from "react";
import { PhotoGrid, type PhotoTile } from "@/components/gallery/photo-grid";
import { PhotoViewer } from "@/components/gallery/photo-viewer";
import { buttonVariants } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries/pt-BR";
import { format } from "@/i18n/format";
import type { HostPhoto } from "@/lib/host-media";

type Props = {
  photos: HostPhoto[];
  dict: Dictionary["gallery"];
  downloadLabel: string;
};

export function HostPhotoGallery({ photos, dict, downloadLabel }: Props) {
  const [selected, setSelected] = useState<HostPhoto | null>(null);

  const labels: Partial<Record<HostPhoto["status"], string>> = {
    PROCESSING: dict.status.processing,
    PENDING_APPROVAL: dict.status.pendingApproval,
  };

  const tiles: PhotoTile[] = photos.map((photo) => ({
    id: photo.id,
    imageUrl: photo.thumbnailUrl,
    alt: format(dict.photoBy, { name: photo.authorName }),
    filter: photo.filter,
    label: labels[photo.status],
    onPress: photo.displayUrl ? () => setSelected(photo) : undefined,
  }));

  return (
    <>
      <PhotoGrid tiles={tiles} className="sm:grid-cols-4 md:grid-cols-5" />
      <PhotoViewer
        photo={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        dict={dict}
        actions={
          selected?.originalUrl && (
            <a href={selected.originalUrl} className={buttonVariants()}>
              <DownloadIcon data-icon="inline-start" />
              {downloadLabel}
            </a>
          )
        }
      />
    </>
  );
}
