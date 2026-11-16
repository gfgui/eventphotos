import { cn } from "cn";
import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { LikeButton, type LikeState } from "@/components/gallery/like-button";
import { Badge } from "@/components/ui/badge";
import { filterCss } from "@/lib/filters";

// The rows a phone shows without scrolling.
const photosAboveTheFold = 9;

export type PhotoTile = {
  id: string;
  /** Null while there is nothing to show yet. */
  imageUrl: string | null;
  alt: string;
  /** The filter chosen when sending, applied here and never to the file. */
  filter?: string | null;
  /** Where the photo stands, when it isn't simply published. */
  label?: string;
  /** Absent when tapping does nothing. */
  onPress?: () => void;
  /** Only published photos can be liked. */
  like?: LikeState;
};

type Props = { tiles: PhotoTile[]; className?: string };

export function PhotoGrid({ tiles, className }: Props) {
  return (
    <div className={cn("grid grid-cols-3 gap-1.5", className)}>
      {tiles.map((tile, index) => (
        // Two buttons side by side, since a button can't hold another one.
        <div
          key={tile.id}
          className="group relative aspect-[3/4] overflow-hidden rounded-sm bg-muted"
        >
          <button
            type="button"
            disabled={!tile.onPress}
            onClick={tile.onPress}
            className="absolute inset-0 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
          >
            {tile.imageUrl ? (
              // Already resized by the worker, so Next.js has nothing to optimize.
              <Image
                src={tile.imageUrl}
                alt={tile.alt}
                fill
                unoptimized
                loading={index < photosAboveTheFold ? "eager" : "lazy"}
                style={{ filter: filterCss(tile.filter) }}
                className="object-cover transition duration-500 group-hover:scale-[1.03]"
              />
            ) : (
              <span className="absolute inset-0 grid place-items-center text-muted-foreground">
                <ImageIcon aria-hidden="true" className="size-6" />
                <span className="sr-only">{tile.alt}</span>
              </span>
            )}
          </button>
          {tile.label && (
            <Badge
              variant="secondary"
              className="pointer-events-none absolute bottom-1 left-1"
            >
              {tile.label}
            </Badge>
          )}
          {tile.like && (
            <LikeButton
              {...tile.like}
              variant="overlay"
              className="absolute right-1 bottom-1"
            />
          )}
        </div>
      ))}
    </div>
  );
}
