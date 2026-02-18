'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/card/Card';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ErrorCpnt } from '@/components/error/ErrorCpnt';
import { Loading } from '@/components/loader/Loading';
import axios from 'axios';

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
  seller: {
    user: {
      name: string | null;
    };
  };
  averageRating?: number;
  reviewCount?: number;
}

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Newest first', sortBy: 'createdAt', sortOrder: 'desc' as const },
  { value: 'createdAt-asc', label: 'Oldest first', sortBy: 'createdAt', sortOrder: 'asc' as const },
  { value: 'price-asc', label: 'Price: low to high', sortBy: 'price', sortOrder: 'asc' as const },
  { value: 'price-desc', label: 'Price: high to low', sortBy: 'price', sortOrder: 'desc' as const },
  { value: 'name-asc', label: 'Name: A–Z', sortBy: 'name', sortOrder: 'asc' as const },
  { value: 'name-desc', label: 'Name: Z–A', sortBy: 'name', sortOrder: 'desc' as const },
];

export const ItemListPage: React.FC = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const category = params?.category as string | undefined;
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [sortValue, setSortValue] = useState('createdAt-desc');

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const search = searchInput.trim() || undefined;
      const option = SORT_OPTIONS.find((o) => o.value === sortValue) || SORT_OPTIONS[0];
      const { sortBy, sortOrder } = option;

      if (category) {
        const encodedCategory = encodeURIComponent(category);
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        params.set('sortBy', sortBy);
        params.set('sortOrder', sortOrder);
        const qs = params.toString();
        const url = `/api/categories/${encodedCategory}${qs ? `?${qs}` : ''}`;
        const response = await axios.get(url);
        setProducts(response.data.products || []);
      } else {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        params.set('sortBy', sortBy);
        params.set('sortOrder', sortOrder);
        const qs = params.toString();
        const url = `/api/products${qs ? `?${qs}` : ''}`;
        const response = await axios.get(url);
        setProducts(response.data.products || []);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError(category ? `Category "${category}" not found` : 'Not found');
      } else {
        setError(err.response?.data?.error || 'Failed to load products');
      }
    } finally {
      setIsLoading(false);
    }
  }, [category, searchInput, sortValue]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  if (isLoading) return <Loading/>;
  
  // Show custom error message for category not found
  if (error) {
    if (error.includes("not found")) {
      return (
        <div className="max-w-7xl px-2 mx-auto sm:px-6 lg:px-10 m-2 flex my-4 md:my-8 flex-col">
          <div className="flex flex-col items-center justify-center mt-24 py-16">
            <div className="text-center">
              <svg
                className="mx-auto h-24 w-24 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Category Not Found</h3>
              <p className="text-gray-500 mb-6">
                The category "{category}" does not exist or has been removed.
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
              >
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return <ErrorCpnt/>;
  }

  return (
    <div className="max-w-7xl px-2 mx-auto sm:px-6 lg:px-10 m-2 flex my-4 md:my-8 flex-col">
      <div>
        <nav className="flex justify-center m-5" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
            <li className="inline-flex items-center">
              <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-700">
                Home
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg
                  className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 6 10"
                >
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                </svg>
                <Link href={`/${category}`} className="ms-1 text-sm font-medium text-gray-700">
                  {category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Products'}
                </Link>
              </div>
            </li>
          </ol>
        </nav>
        <p className="text-7xl text-black text-center">{category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Products'}</p>
        <hr className="w-44 mx-auto mt-5 border-2 border-violet-700" />
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-4">
          <div className="w-full sm:max-w-xs">
            <input
              type="search"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
            <label htmlFor="sort-products" className="text-sm text-muted-foreground whitespace-nowrap">Sort by</label>
            <select
              id="sort-products"
              value={sortValue}
              onChange={(e) => setSortValue(e.target.value)}
              className="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 min-w-[180px]"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => fetchProducts()}
              className="rounded-md bg-violet-700 px-3 py-2 text-sm font-medium text-white hover:bg-violet-800 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
        <p className="text-center m-3">Showing {products.length} products</p>
      </div>
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-24 py-16">
          <div className="text-center">
            <svg
              className="mx-auto h-24 w-24 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No items yet</h3>
            <p className="text-gray-500 mb-6">
              {category
                ? `There are no products available in the ${category.charAt(0).toUpperCase() + category.slice(1)} category at the moment.`
                : "There are no products available at the moment."}
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
            >
              Browse Other Categories
            </Link>
          </div>
        </div>
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
