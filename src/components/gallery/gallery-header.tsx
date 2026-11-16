import { EventMonogram } from "@/components/event-monogram";
import { GuestAvatar } from "@/components/guest-avatar";
import { format } from "@/i18n/format";

type Props = {
  eventName: string;
  guest: { name: string; avatar: string; roleName: string };
  greeting: string;
};

export function GalleryHeader({ eventName, guest, greeting }: Props) {
  const firstName = guest.name.split(/\s+/)[0];

  return (
    <div className="mx-auto flex h-[68px] max-w-[540px] items-center justify-between gap-4 px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <GuestAvatar avatar={guest.avatar} className="size-9 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-[11px] text-muted-foreground">
            {format(greeting, { name: firstName })}
          </p>
          <p className="truncate text-xs font-medium">{guest.roleName}</p>
        </div>
      </div>
      <EventMonogram
        name={eventName}
        className="shrink-0 text-[28px] leading-none"
      />
    </div>
  );
}
