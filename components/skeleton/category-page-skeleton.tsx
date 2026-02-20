import { Skeleton } from '@/components/ui/skeleton';
import { ProductGridSkeleton } from './product-grid-skeleton';

export function CategoryHeaderSkeleton() {
  return (
    <div>
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-16 w-64 mx-auto" />
      <Skeleton className="h-0.5 w-44 mx-auto mt-5" />
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-4">
        <Skeleton className="h-10 w-full sm:max-w-xs max-w-[300px]" />
        <Skeleton className="h-10 w-[180px]" />
      </div>
    </div>
  );
}

export function CategoryPageSkeleton() {
  return (
    <>
      <CategoryHeaderSkeleton />
      <ProductGridSkeleton />
    </>
  );
}
