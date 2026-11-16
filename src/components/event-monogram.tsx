import { cn } from "@/lib/utils";

/** Initials of the first and last words of a name, such as "JM" for "João & Maria". */
function monogram(name: string) {
  const words = name.split(/\s+/).filter((word) => /^\p{L}/u.test(word));
  const letters =
    words.length > 1 ? `${words[0][0]}${words.at(-1)?.[0]}` : words[0]?.[0];
  return (letters ?? name.slice(0, 2)).toUpperCase();
}

type Props = { name: string; className?: string };

export function EventMonogram({ name, className }: Props) {
  return (
    <div
      aria-hidden="true"
      data-slot="event-monogram"
      className={cn("font-heading font-semibold tracking-tighter", className)}
    >
      {monogram(name)}
    </div>
  );
}
