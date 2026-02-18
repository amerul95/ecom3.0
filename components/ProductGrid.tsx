'use client';

import React, { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/card/Card';
import type { ProductListResponse } from '@/server/dto/product.dto';
import type { SortOption } from './SortSelect';

interface ProductGridProps {
  products: ProductListResponse['products'];
}

export function ProductGrid({ products }: ProductGridProps) {
  const searchParams = useSearchParams();
  const sortBy: SortOption = (searchParams?.get('sort') as SortOption) || 'createdAt-desc';
  const sortedProducts = useMemo(() => {
    const sorted = [...products];
    
    switch (sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'createdAt-desc':
        return sorted.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'createdAt-asc':
        return sorted.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      default:
        return sorted;
    }
  }, [products, sortBy]);

  if (sortedProducts.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-24 max-w-7xl mx-auto w-full">
      {sortedProducts.map(data => (
        <Card key={data.id} data={data} />
      ))}
    </div>
  );
}
