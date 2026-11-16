import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder while an event page loads, shaped like the first step of the entry. */
export function EventSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-center gap-4 px-6"
    >
      <Skeleton className="mx-auto size-14 rounded-full" />
      <Skeleton className="mx-auto h-9 w-2/3" />
      <Skeleton className="mt-10 h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}
