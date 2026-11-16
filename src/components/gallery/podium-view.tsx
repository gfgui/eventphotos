import { HeartIcon, ImageIcon } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { GuestAvatar } from "@/components/guest-avatar";
import type { Dictionary } from "@/i18n/dictionaries/pt-BR";
import { format } from "@/i18n/format";
import { filterCss } from "@/lib/filters";
import type { Podium } from "@/lib/podium";

type Dict = Dictionary["gallery"]["podium"];

type Props = {
  podium: Podium;
  dict: Dict;
  photoBy: string;
  onView: (id: string) => void;
};

/** The rankings the hosts left on: the most liked photos and who sent the most. */
export function PodiumView({ podium, dict, photoBy, onView }: Props) {
  return (
    <div className="grid gap-4 px-1">
      {podium.photos && (
        <Board
          id="podium-photos"
          title={dict.photosTitle}
          empty={podium.photos.length === 0 ? dict.photosEmpty : undefined}
        >
          {podium.photos.map((photo, index) => {
            const title = format(photoBy, { name: photo.authorName });
            return (
              <li key={photo.id} className="flex items-center gap-3 p-3">
                <Place index={index} dict={dict} />
                <button
                  type="button"
                  onClick={() => onView(photo.id)}
                  className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {photo.thumbnailUrl ? (
                    <Image
                      src={photo.thumbnailUrl}
                      alt={title}
                      fill
                      unoptimized
                      style={{ filter: filterCss(photo.filter) }}
                      className="object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center text-muted-foreground">
                      <ImageIcon aria-hidden="true" className="size-5" />
                      <span className="sr-only">{title}</span>
                    </span>
                  )}
                </button>
                <p className="min-w-0 flex-1 truncate text-sm font-medium">
                  {title}
                </p>
                <p className="flex shrink-0 items-center gap-1 text-sm font-medium">
                  <HeartIcon
                    aria-hidden="true"
                    className="size-4 fill-current"
                  />
                  <span aria-hidden="true">{photo.likeCount}</span>
                  <span className="sr-only">
                    {format(dict.likes, { count: photo.likeCount })}
                  </span>
                </p>
              </li>
            );
          })}
        </Board>
      )}

      {podium.guests && (
        <Board
          id="podium-guests"
          title={dict.guestsTitle}
          empty={podium.guests.length === 0 ? dict.guestsEmpty : undefined}
        >
          {podium.guests.map((guest, index) => (
            <li key={guest.id} className="flex items-center gap-3 p-3">
              <Place index={index} dict={dict} />
              <GuestAvatar avatar={guest.avatar} className="size-10 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{guest.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {guest.roleName}
                </p>
              </div>
              <p className="shrink-0 text-sm font-medium">
                {format(dict.photos, { count: guest.photoCount })}
              </p>
            </li>
          ))}
        </Board>
      )}
    </div>
  );
}

type BoardProps = {
  id: string;
  title: string;
  /** Shown instead of the list while nobody qualifies. */
  empty?: string;
  children: ReactNode;
};

function Board({ id, title, empty, children }: BoardProps) {
  return (
    <section
      aria-labelledby={id}
      className="overflow-hidden rounded-lg border bg-card text-card-foreground"
    >
      <h2 id={id} className="border-b px-4 py-3 font-heading text-xl">
        {title}
      </h2>
      {empty ? (
        <p className="p-4 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ol className="divide-y">{children}</ol>
      )}
    </section>
  );
}

function Place({ index, dict }: { index: number; dict: Dict }) {
  return (
    <span className="w-6 shrink-0 text-center text-sm font-semibold text-muted-foreground">
      <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      <span className="sr-only">
        {format(dict.place, { place: index + 1 })}
      </span>
    </span>
  );
}
