import { Skeleton } from '@/components/ui/skeleton';

export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-24 max-w-7xl mx-auto w-full">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="w-full bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
          {/* Image skeleton - matches Card's aspect-square */}
          <div className="w-full aspect-square bg-gray-100">
            <Skeleton className="h-full w-full rounded-none" />
          </div>
          
          {/* Content skeleton */}
          <div className="p-4 space-y-3">
            {/* Product name */}
            <Skeleton className="h-5 w-3/4" />
            
            {/* Price */}
            <Skeleton className="h-6 w-20" />
            
            {/* Buttons area */}
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-9 flex-1 rounded-md" />
              <Skeleton className="h-9 w-20 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
