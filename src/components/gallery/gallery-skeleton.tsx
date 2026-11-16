import { Skeleton } from "@/components/ui/skeleton";

const placeholders = Array.from({ length: 9 }, (_, index) => index);

export function GallerySkeleton() {
  return (
    <div aria-hidden="true" className="min-h-dvh">
      <div className="mx-auto flex h-[68px] max-w-[540px] items-center gap-2.5 px-4">
        <Skeleton className="size-9 rounded-full" />
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="mx-auto grid max-w-[540px] grid-cols-3 gap-1.5 px-2 py-14">
        {placeholders.map((index) => (
          <Skeleton key={index} className="aspect-[3/4] rounded-sm" />
        ))}
      </div>
    </div>
  );
}
