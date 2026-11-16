import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder while a page of the panel checks the session. */
export function AdminSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-4"
    >
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
    </div>
  );
}
