import { isAvatarRef } from "@/lib/avatars";
import { cn } from "@/lib/utils";

// Placeholder art, embedded so nothing depends on the internet: SVG paths that are either
// filled or stroked. Colors come from the theme, through currentColor.
type Art = { fill?: string; stroke?: string };

const circle = (x: number, y: number, r: number) =>
  `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

const eyes: Art[] = [
  { fill: circle(17, 20, 2.5) + circle(31, 20, 2.5) },
  { stroke: "M13 21q4-5 8 0M27 21q4-5 8 0" },
  { fill: circle(17, 20, 2.5), stroke: "M27 20h8" },
  { stroke: `${circle(17, 20, 5)}${circle(31, 20, 5)}M22 20h4` },
];

const mouths: Art[] = [
  { stroke: "M16 30q8 8 16 0" },
  { fill: "M15 29h18a9 9 0 0 1-18 0Z" },
  { stroke: circle(24, 33, 3) },
  { stroke: "M18 34q8 2 13-4" },
];

const marks: Art[] = [
  { fill: circle(24, 24, 9) },
  { stroke: circle(24, 24, 10) },
  { fill: "M15 15h18v18H15Z" },
  { fill: "M24 12 36 24 24 36 12 24Z" },
  { fill: "M24 13 36 34H12Z" },
  { fill: "M24 14a10 10 0 1 0 0 20Z" },
  { stroke: "M14 24h20M24 14v20" },
  { stroke: "M13 30q5.5-12 11 0t11 0" },
];

function artFor(set: string, index: number): Art[] {
  if (set !== "casual") return [marks[index % marks.length]];
  return [
    eyes[index % eyes.length],
    mouths[Math.floor(index / eyes.length) % mouths.length],
  ];
}

type Props = { avatar: string; className?: string };

/** Renders a reference saved in Guest.avatar, such as "casual/12". */
export function GuestAvatar({ avatar, className }: Props) {
  const [set, position] = (isAvatarRef(avatar) ? avatar : "discreet/0").split(
    "/",
  );
  const index = Number(position);
  const art = artFor(set, index);
  // Alternates like a checkerboard in the four columns of the picker.
  const isDark = (index + Math.floor(index / 4) + Math.floor(index / 8)) % 2;

  return (
    <span
      className={cn(
        "block overflow-hidden rounded-full",
        isDark
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-foreground",
        className,
      )}
    >
      <svg aria-hidden="true" viewBox="0 0 48 48" className="size-full">
        <path d={art.map(({ fill }) => fill).join("")} fill="currentColor" />
        <path
          d={art.map(({ stroke }) => stroke).join("")}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
