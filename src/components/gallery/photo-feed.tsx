import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { aspectRatio, type FeedItem } from "@/components/gallery/feed-item";
import { LikeButton } from "@/components/gallery/like-button";
import { GuestAvatar } from "@/components/guest-avatar";
import { filterCss } from "@/lib/filters";

// The cards a phone shows without scrolling.
const photosAboveTheFold = 2;

/** The "list" feed: one card per photo, with who sent it and its likes. */
export function PhotoFeed({ items }: { items: FeedItem[] }) {
  return (
    <div className="grid gap-4">
      {items.map((item, index) => (
        <article
          key={item.id}
          className="overflow-hidden rounded-lg border bg-card text-card-foreground"
        >
          <header className="flex items-center gap-3 p-3">
            <GuestAvatar
              avatar={item.author.avatar}
              className="size-9 shrink-0"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.author.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {item.author.roleName}
              </p>
            </div>
          </header>
          <button
            type="button"
            disabled={!item.onPress}
            onClick={item.onPress}
            style={{
              aspectRatio: aspectRatio(item, { widest: 1.91, tallest: 0.8 }),
            }}
            className="relative block w-full bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
          >
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.alt}
                fill
                unoptimized
                loading={index < photosAboveTheFold ? "eager" : "lazy"}
                style={{ filter: filterCss(item.filter) }}
                className="object-cover"
              />
            ) : (
              <span className="absolute inset-0 grid place-items-center text-muted-foreground">
                <ImageIcon aria-hidden="true" className="size-6" />
                <span className="sr-only">{item.alt}</span>
              </span>
            )}
          </button>
          {(item.caption || item.like) && (
            <footer className="grid gap-2 p-3">
              {item.caption && (
                <p className="text-sm break-words">{item.caption}</p>
              )}
              {item.like && (
                <LikeButton
                  {...item.like}
                  variant="outline"
                  className="justify-self-start"
                />
              )}
            </footer>
          )}
        </article>
      ))}
    </div>
  );
}
