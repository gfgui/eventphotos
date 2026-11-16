import { eventMonogram } from "@/lib/monogram";
import { cn } from "@/lib/utils";

type Props = {
  event: { name: string; honorees: string[] };
  className?: string;
};

/** The event's initials, from its honorees when the hosts gave them. */
export function EventMonogram({ event, className }: Props) {
  return (
    <div
      aria-hidden="true"
      data-slot="event-monogram"
      className={cn("font-heading font-semibold tracking-tighter", className)}
    >
      {eventMonogram(event)}
    </div>
  );
}
