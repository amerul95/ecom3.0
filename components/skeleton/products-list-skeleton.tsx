import { Skeleton } from '@/components/ui/skeleton';

export function ProductsListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border overflow-hidden">
          <Skeleton className="w-full h-48 rounded-none" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-8 w-24" />
            <div className="flex justify-between gap-2">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 flex-1" />
            </div>
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 flex-1 rounded-md" />
              <Skeleton className="h-8 flex-1 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
