import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { aspectRatio, type FeedItem } from "@/components/gallery/feed-item";
import { LikeButton } from "@/components/gallery/like-button";
import { filterCss } from "@/lib/filters";

// The photos a phone shows without scrolling, in both columns.
const photosAboveTheFold = 6;

/**
 * The "wall" feed: two columns, each photo in its own shape. The photos alternate between the
 * columns, so the top of the wall keeps the top of the sorting.
 */
export function PhotoWall({ items }: { items: FeedItem[] }) {
  const columns = [0, 1].map((column) =>
    items.flatMap((item, index) =>
      index % 2 === column ? [{ item, index }] : [],
    ),
  );

  return (
    <div className="grid grid-cols-2 items-start gap-1.5">
      {columns.map((column, columnIndex) => (
        <div
          key={columnIndex === 0 ? "left" : "right"}
          className="grid gap-1.5"
        >
          {column.map(({ item, index }) => (
            <div
              key={item.id}
              style={{
                aspectRatio: aspectRatio(item, { widest: 2, tallest: 0.5 }),
              }}
              className="group relative overflow-hidden rounded-sm bg-muted"
            >
              <button
                type="button"
                disabled={!item.onPress}
                onClick={item.onPress}
                className="absolute inset-0 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
              >
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.alt}
                    fill
                    unoptimized
                    loading={index < photosAboveTheFold ? "eager" : "lazy"}
                    style={{ filter: filterCss(item.filter) }}
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-muted-foreground">
                    <ImageIcon aria-hidden="true" className="size-6" />
                    <span className="sr-only">{item.alt}</span>
                  </span>
                )}
              </button>
              {item.like && (
                <LikeButton
                  {...item.like}
                  variant="overlay"
                  className="absolute right-1 bottom-1"
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
