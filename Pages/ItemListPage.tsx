'use client';

import React from 'react';
import { Card } from '@/components/card/Card';
import { NoProducts } from '@/components/NoProducts';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ErrorMessage } from '@/components/ErrorMessage';
import Search from '@/components/search/search';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number | string;
  stock: number;
  images: string[];
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  averageRating?: number;
  reviewCount?: number;
}

interface ItemListPageProps {
  products: Product[];
  category?: string;
  categoryData?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  error?: string | null;
}

export const ItemListPage: React.FC<ItemListPageProps> = ({ 
  products, 
  category, 
  categoryData,
  error 
}) => {

  // Show error message
  if (error) {
    return <ErrorMessage error={error} category={category} />;
  }

  return (
    <div className="max-w-7xl px-2 mx-auto sm:px-6 lg:px-10 m-2 flex my-4 md:my-8 flex-col">
      <div>
        <Breadcrumbs category={category} />
        <p className="text-7xl text-black text-center">
          {categoryData?.name || (category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Products')}
        </p>
        <hr className="w-44 mx-auto mt-5 border-2 border-violet-700" />
        
        <Search />
        <p className="text-center m-3">Showing {products.length} products</p>
      </div>
      {products.length === 0 ? (
        <NoProducts category={category} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-24 max-w-7xl mx-auto w-full">
          {products.map(data => (
            <Card key={data.id} data={data} />
          ))}
        </div>
      )}
    </div>
  );
};
