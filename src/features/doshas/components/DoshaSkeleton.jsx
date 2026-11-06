import { Skeleton } from "@/components/ui/skeleton";

export function DoshaCardSkeleton() {
  return (
    <div className="rounded-3xl border border-border/70 bg-card/60 backdrop-blur-xl p-5 sm:p-6 flex flex-col justify-between min-h-[380px] shadow-xs">
      <div>
        <Skeleton className="w-full h-44 rounded-2xl mb-4" />
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-6 w-3/4 mb-3" />
        <Skeleton className="h-4 w-full mb-1.5" />
        <Skeleton className="h-4 w-5/6 mb-4" />
      </div>

      <div className="pt-4 border-t border-border/50 flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function DoshasGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <DoshaCardSkeleton key={idx} />
      ))}
    </div>
  );
}

export function DoshaDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
      <Skeleton className="h-5 w-48 rounded-md" />
      <div className="rounded-3xl border border-border/70 p-6 sm:p-10 space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-4/5" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="w-full h-72 sm:h-96 rounded-2xl mt-4" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-64 rounded-2xl md:col-span-2" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}

export default DoshasGridSkeleton;

