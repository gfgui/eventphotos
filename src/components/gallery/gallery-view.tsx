"use client";

import { useRouter } from "next/navigation";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { AddPhotoBar } from "@/components/gallery/add-photo-bar";
import { EmptyGallery } from "@/components/gallery/empty-gallery";
import type { FeedItem } from "@/components/gallery/feed-item";
import { FilterStep } from "@/components/gallery/filter-step";
import { GalleryHeader } from "@/components/gallery/gallery-header";
import { LikeButton, type LikeState } from "@/components/gallery/like-button";
import { PhotoFeed } from "@/components/gallery/photo-feed";
import { PhotoGrid, type PhotoTile } from "@/components/gallery/photo-grid";
import { PhotoViewer } from "@/components/gallery/photo-viewer";
import { PhotoWall } from "@/components/gallery/photo-wall";
import { PodiumView } from "@/components/gallery/podium-view";
import { SortControl } from "@/components/gallery/sort-control";
import { useLikes } from "@/components/gallery/use-likes";
import { type Upload, useUploads } from "@/components/gallery/use-uploads";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MediaStatus } from "@/generated/prisma/client";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/pt-BR";
import { format } from "@/i18n/format";
import type { FilterId, UploadSource } from "@/lib/filters";
import type { GalleryPhoto } from "@/lib/media";
import type { Podium } from "@/lib/podium";
import { type SortMode, sortPhotos } from "@/lib/ranking";
import {
  allowedPhotoTypes,
  isAcceptedPhoto,
  maxPhotoBytes,
} from "@/lib/upload-limits";
import type { FeedStyle } from "@/themes/config";

type Tab = keyof Dictionary["gallery"]["tabs"];

/** Photos picked and waiting for a filter. The key gives each batch a fresh filter screen. */
type Batch = { key: number; files: File[]; source: UploadSource };

const tabContentClass = "mx-auto w-full max-w-[540px] px-2 py-3";

type Props = {
  lang: Locale;
  slug: string;
  event: { name: string; honorees: string[] };
  guest: { name: string; avatar: string; roleName: string };
  photos: GalleryPhoto[];
  /** Null when the hosts turned both rankings off: then the tab disappears. */
  podium: Podium | null;
  /** How the Photos tab lays them out, as the hosts chose. */
  feedStyle: FeedStyle;
  canUpload: boolean;
  dict: Dictionary["gallery"];
  /** Absent when the hosts fixed the event's language: there is nothing to switch. */
  languageLabel?: string;
};

export function GalleryView({
  lang,
  slug,
  event,
  guest,
  photos,
  podium,
  feedStyle,
  canUpload,
  dict,
  languageLabel,
}: Props) {
  const router = useRouter();
  const { uploads, addFiles, retry } = useUploads(slug);
  const likes = useLikes();
  const [tab, setTab] = useState<Tab>("photos");
  const [sort, setSort] = useState<SortMode>("hot");
  const [batch, setBatch] = useState<Batch | null>(null);
  const [wasRefused, setWasRefused] = useState(false);
  const [viewedId, setViewedId] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const lastBatchKey = useRef(0);

  // Until the real-time updates exist, this is how a processed photo shows up.
  const isProcessing = photos.some((photo) => photo.status === "PROCESSING");
  useEffect(() => {
    if (!isProcessing) return;
    const timer = setInterval(() => router.refresh(), 2500);
    return () => clearInterval(timer);
  }, [isProcessing, router]);

  const statusLabels: Partial<Record<MediaStatus, string>> = {
    PROCESSING: dict.status.processing,
    PENDING_APPROVAL: dict.status.pendingApproval,
    FAILED: dict.status.failed,
  };

  const knownPhotos = new Set(photos.map((photo) => photo.id));
  const previews = new Map(
    uploads.map((upload) => [upload.mediaId, upload.previewUrl]),
  );

  function likeOf(photo: GalleryPhoto): LikeState | undefined {
    if (photo.status !== "PUBLISHED") return undefined;
    const liked = likes.isLiked(photo);
    const count = likes.countOf(photo);
    return {
      liked,
      count,
      pending: likes.isPending(photo.id),
      label: format(liked ? dict.unlike : dict.like, {
        name: photo.authorName,
        count,
      }),
      onToggle: () => likes.toggle(photo),
    };
  }

  function photoTile(photo: GalleryPhoto): PhotoTile {
    return {
      id: photo.id,
      imageUrl:
        photo.thumbnailUrl ??
        (photo.status === "PROCESSING" ? previews.get(photo.id) : null) ??
        null,
      alt: format(dict.photoBy, { name: photo.authorName }),
      filter: photo.filter,
      label: statusLabels[photo.status],
      onPress: photo.displayUrl ? () => viewPhoto(photo.id) : undefined,
      like: likeOf(photo),
    };
  }

  function feedItem(photo: GalleryPhoto): FeedItem {
    return {
      id: photo.id,
      // One photo across the screen needs the display version; two side by side, the thumbnail.
      imageUrl: feedStyle === "list" ? photo.displayUrl : photo.thumbnailUrl,
      alt: format(dict.photoBy, { name: photo.authorName }),
      filter: photo.filter,
      width: photo.width,
      height: photo.height,
      author: {
        name: photo.authorName,
        avatar: photo.authorAvatar,
        roleName: photo.authorRole,
      },
      onPress: photo.displayUrl ? () => viewPhoto(photo.id) : undefined,
      like: likeOf(photo),
    };
  }

  function uploadTile(upload: Upload): PhotoTile {
    const labels = {
      uploading: format(dict.status.uploading, { percent: upload.percent }),
      failed: dict.status.retry,
      confirmed: dict.status.processing,
    };
    return {
      id: upload.id,
      imageUrl: upload.previewUrl,
      alt: format(dict.photoBy, { name: guest.name }),
      filter: upload.filter,
      label: labels[upload.state],
      onPress: upload.state === "failed" ? () => retry(upload.id) : undefined,
    };
  }

  // Sorted by what the server said, so a photo doesn't jump away right after a like.
  const published = sortPhotos(
    photos.filter((photo) => photo.status === "PUBLISHED"),
    sort,
  );
  const inProgress = uploads.filter(
    (upload) => !upload.mediaId || !knownPhotos.has(upload.mediaId),
  );
  const mine = [
    ...inProgress.map(uploadTile),
    ...photos.filter((photo) => photo.isMine).map(photoTile),
  ];

  const tabs: Tab[] = podium
    ? ["photos", "podium", "mine"]
    : ["photos", "mine"];
  // The hosts may turn the rankings off while the Podium is open.
  const currentTab = tabs.includes(tab) ? tab : "photos";

  const viewed = photos.find((photo) => photo.id === viewedId) ?? null;
  const viewedLike = viewed && likeOf(viewed);

  /** Takes the photos just picked to the filter screen, minus the ones that can't be sent. */
  function pickFrom(source: UploadSource) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      event.target.value = "";
      if (files.length === 0) return;

      const accepted = files.filter(isAcceptedPhoto);
      setWasRefused(accepted.length < files.length);
      if (accepted.length === 0) return;
      lastBatchKey.current += 1;
      setBatch({ key: lastBatchKey.current, files: accepted, source });
    };
  }

  function send(current: Batch, filter: FilterId) {
    setBatch(null);
    if (!addFiles(current.files, { filter, source: current.source })) {
      setWasRefused(true);
    }
    setTab("mine");
  }

  function viewPhoto(id: string) {
    setViewedId(id);
    setIsViewerOpen(true);
  }

  const choosePhotos = () => galleryInput.current?.click();
  const empty = (
    <EmptyGallery onPick={canUpload ? choosePhotos : undefined} dict={dict} />
  );

  return (
    <main className="min-h-dvh pb-[calc(80px+env(safe-area-inset-bottom))]">
      <Tabs value={currentTab} onValueChange={(value: Tab) => setTab(value)}>
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl">
          <GalleryHeader event={event} guest={guest} greeting={dict.greeting} />
          <div className="mx-auto max-w-[540px] px-4">
            <TabsList
              variant="line"
              aria-label={dict.tabsLabel}
              className="w-full border-b pb-1 group-data-horizontal/tabs:h-11"
            >
              {tabs.map((id) => (
                <TabsTrigger key={id} value={id}>
                  {dict.tabs[id]}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </header>

        {likes.failed && (
          <p
            role="alert"
            className="mx-auto max-w-[540px] px-4 pt-3 text-center text-sm text-destructive"
          >
            {dict.likeFailed}
          </p>
        )}

        <TabsContent value="photos" className={tabContentClass}>
          {published.length > 0 ? (
            <div className="grid gap-3">
              <SortControl value={sort} onChange={setSort} dict={dict} />
              {feedStyle === "list" && (
                <PhotoFeed items={published.map(feedItem)} />
              )}
              {feedStyle === "wall" && (
                <PhotoWall items={published.map(feedItem)} />
              )}
              {feedStyle === "grid" && (
                <PhotoGrid tiles={published.map(photoTile)} />
              )}
            </div>
          ) : (
            empty
          )}
        </TabsContent>

        {podium && (
          <TabsContent value="podium" className={tabContentClass}>
            <PodiumView
              podium={podium}
              dict={dict.podium}
              photoBy={dict.photoBy}
              onView={viewPhoto}
            />
          </TabsContent>
        )}

        <TabsContent value="mine" className={tabContentClass}>
          {mine.length > 0 ? <PhotoGrid tiles={mine} /> : empty}
        </TabsContent>
      </Tabs>

      {languageLabel && (
        <LanguageSwitcher current={lang} label={languageLabel} />
      )}

      {canUpload && (
        <>
          {/* The phone's own camera: it works over plain HTTP and keeps the full photo. */}
          <input
            ref={cameraInput}
            type="file"
            accept={allowedPhotoTypes.join(",")}
            capture="environment"
            hidden
            onChange={pickFrom("CAMERA")}
          />
          <input
            ref={galleryInput}
            type="file"
            accept={allowedPhotoTypes.join(",")}
            multiple
            hidden
            onChange={pickFrom("GALLERY")}
          />
          <AddPhotoBar
            labels={dict}
            error={
              wasRefused
                ? format(dict.uploadRefused, {
                    max: maxPhotoBytes / (1024 * 1024),
                  })
                : undefined
            }
            onTakePhoto={() => cameraInput.current?.click()}
            onChoosePhotos={choosePhotos}
          />
        </>
      )}

      {batch && (
        <FilterStep
          key={batch.key}
          files={batch.files}
          onSend={(filter) => send(batch, filter)}
          onCancel={() => setBatch(null)}
          dict={dict.filters}
        />
      )}

      <PhotoViewer
        photo={viewed}
        open={isViewerOpen}
        onOpenChange={setIsViewerOpen}
        dict={dict}
        actions={viewedLike && <LikeButton {...viewedLike} variant="outline" />}
      />
    </main>
  );
}
