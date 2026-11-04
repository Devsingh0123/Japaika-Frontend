import { Skeleton } from "@/components/ui/skeleton";

export default function BlogSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="flex flex-col rounded-2xl border border-border/80 glass-card overflow-hidden p-0 shadow-sm"
        >
          {/* Image skeleton */}
          <Skeleton className="aspect-[16/9] w-full rounded-none" />

          {/* Body skeleton */}
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>

            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-5 w-4/5" />

            <div className="space-y-1.5 pt-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>

            <div className="pt-3 border-t border-border/60 flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
