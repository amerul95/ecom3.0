'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import Search from '@/components/search/search';
import { SortSelect, type SortOption } from '@/components/SortSelect';

interface ProductListHeaderProps {
  category?: string;
  categoryData?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export function ProductListHeader({
  category,
  categoryData,
}: ProductListHeaderProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const sort = searchParams?.get('sort');
    if (sort && ['price-asc', 'price-desc', 'name-asc', 'name-desc', 'createdAt-desc', 'createdAt-asc'].includes(sort)) {
      return sort as SortOption;
    }
    return 'createdAt-desc';
  });
  const isUpdatingRef = useRef(false);

  // Sync sort state with URL, but don't update URL on every render
  useEffect(() => {
    if (isUpdatingRef.current) {
      isUpdatingRef.current = false;
      return;
    }

    const currentSort = searchParams?.get('sort') || null;
    const expectedSort: string | null = sortBy === 'createdAt-desc' ? null : sortBy;
    
    // Only update URL if sort state doesn't match URL
    if (currentSort !== expectedSort) {
      isUpdatingRef.current = true;
      const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
      if (sortBy !== 'createdAt-desc' && sortBy) {
        params.set('sort', sortBy);
      } else {
        params.delete('sort');
      }
      const paramsString = params.toString();
      const basePath = pathname || '/';
      const newUrl = paramsString ? `${basePath}?${paramsString}` : basePath;
      router.replace(newUrl, { scroll: false });
    }
  }, [sortBy, pathname, router]); 

  return (
    <div>
        <Breadcrumbs category={category} />
      <p className="text-7xl text-black text-center">
        {categoryData?.name || (category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Products')}
      </p>
      <hr className="w-44 mx-auto mt-5 border-2 border-violet-700" />
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-4">
        <div className="w-full sm:max-w-xs">
         
        <Search />
        </div>
        <SortSelect value={sortBy} onChange={setSortBy} />
      </div>
      
    </div>
  );
}
