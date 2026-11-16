import { DownloadIcon } from "lucide-react";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminSkeleton } from "@/components/admin/admin-skeleton";
import { EventHeader } from "@/components/admin/event-header";
import { HostPhotoGallery } from "@/components/admin/host-photo-gallery";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { format, formatFileSize } from "@/i18n/format";
import { getHostEvent } from "@/lib/host-events";
import { listHostPhotos } from "@/lib/host-media";
import { requireHost } from "@/lib/host-session";

type Props = PageProps<"/[lang]/admin/events/[id]/photos">;

export default function EventPhotosPage({ params }: Props) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <EventPhotos params={params} />
    </Suspense>
  );
}

async function EventPhotos({ params }: Pick<Props, "params">) {
  const { id } = await params;
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);
  const host = await requireHost(lang);
  const event = await getHostEvent(host.id, id);
  const photos = await listHostPhotos(event.id);
  const text = dict.admin.photos;

  const downloadable = photos.filter((photo) => photo.originalUrl);
  const totalBytes = downloadable.reduce(
    (total, photo) => total + photo.sizeBytes,
    0,
  );

  return (
    <AdminShell lang={lang} hostName={host.name} dict={dict}>
      <EventHeader
        lang={lang}
        event={event}
        current="photos"
        dict={dict.admin.event}
      />
      {photos.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{text.emptyTitle}</EmptyTitle>
            <EmptyDescription>{text.emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="mt-6 grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {format(text.summary, {
                count: downloadable.length,
                size: formatFileSize(totalBytes, lang),
              })}
            </p>
            {downloadable.length > 0 && (
              <a
                href={`/api/admin/events/${event.id}/originals`}
                className={buttonVariants()}
              >
                <DownloadIcon data-icon="inline-start" />
                {text.downloadAll}
              </a>
            )}
          </div>
          <HostPhotoGallery
            photos={photos}
            dict={dict.gallery}
            downloadLabel={text.downloadOriginal}
          />
        </div>
      )}
    </AdminShell>
  );
}
