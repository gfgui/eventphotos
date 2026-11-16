import { HeartIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type LikeState = {
  liked: boolean;
  count: number;
  /** While the server hasn't answered the last tap, another one does nothing. */
  pending: boolean;
  /** What a tap does, with the total, for screen readers. */
  label: string;
  onToggle: () => void;
};

type Props = LikeState & {
  /** "overlay" sits on top of a photo; "outline" stands next to other buttons. */
  variant: "overlay" | "outline";
  className?: string;
};

export function LikeButton({
  liked,
  count,
  pending,
  label,
  onToggle,
  variant,
  className,
}: Props) {
  const shared = {
    type: "button",
    "aria-label": label,
    "aria-pressed": liked,
    "aria-busy": pending,
    onClick: () => {
      if (!pending) onToggle();
    },
  } as const;
  const heart = (
    <HeartIcon
      aria-hidden="true"
      data-icon="inline-start"
      className={cn(liked && "fill-current")}
    />
  );

  if (variant === "outline") {
    return (
      <Button
        {...shared}
        variant={liked ? "default" : "outline"}
        className={className}
      >
        {heart}
        {count}
      </Button>
    );
  }

  return (
    <button
      {...shared}
      className={cn(
        "flex h-7 items-center gap-1 rounded-full bg-background/85 px-2 text-xs font-medium text-foreground backdrop-blur-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-3.5",
        className,
      )}
    >
      {heart}
      {count}
    </button>
  );
}
