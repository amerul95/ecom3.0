import { ProductGridSkeleton } from '@/components/skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function CategoryLoading() {
  return (
    <div className="max-w-7xl px-2 mx-auto sm:px-6 lg:px-10 m-2 flex my-4 md:my-8 flex-col">
      {/* Header skeleton */}
      <div className="space-y-4">
        <div className="flex justify-center">
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-12 w-64 mx-auto" />
        <Skeleton className="h-0.5 w-44 mx-auto" />
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-4">
          <Skeleton className="h-10 w-full sm:max-w-xs max-w-[300px]" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>

      {/* Product grid skeleton */}
      <ProductGridSkeleton />
    </div>
  );
}
