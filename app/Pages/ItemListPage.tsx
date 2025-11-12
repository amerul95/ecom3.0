'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '../components/card/Card';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ErrorCpnt } from '../components/error/ErrorCpnt';
import { Loading } from '../components/loader/Loading';
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

export const ItemListPage: React.FC = () => {
  const params = useParams();
  const category = params?.category as string | undefined;
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug: Log the category parameter
  console.log('🔍 ItemListPage - Category from params:', category);
  console.log('🔍 ItemListPage - Full params:', params);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch products by category slug
        if (category) {
          console.log('🔍 Fetching products for category:', category);
          console.log('🔗 API URL:', `/api/categories/${category}`);
          
          // URL encode the category slug in case it has special characters
          const encodedCategory = encodeURIComponent(category);
          console.log('🔗 Encoded category:', encodedCategory);
          
          const response = await axios.get(`/api/categories/${encodedCategory}`);
          console.log('📦 API Response:', response.data);
          console.log('📊 Products array:', response.data.products);
          console.log('📈 Number of products:', response.data.products?.length || 0);
          console.log('🏷️ Category info:', response.data.category);
          setProducts(response.data.products || []);
        } else {
          // Fetch all products if no category
          console.log('🔍 Fetching all products');
          const response = await axios.get('/api/products');
          console.log('📦 API Response:', response.data);
          console.log('📊 Products array:', response.data.products);
          console.log('📈 Number of products:', response.data.products?.length || 0);
          setProducts(response.data.products || []);
        }
      } catch (err: any) {
        console.error('❌ Failed to fetch products:', err);
        console.error('❌ Error details:', err.response?.data);
        console.error('❌ Status code:', err.response?.status);
        
        // Handle 404 - category not found
        if (err.response?.status === 404) {
          setError(`Category "${category}" not found`);
        } else {
          setError(err.response?.data?.error || 'Failed to load products');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  if (isLoading) return <Loading/>;
  
  // Show custom error message for category not found
  if (error) {
    if (error.includes('not found')) {
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

  console.log('🎨 Rendering ItemListPage with category:', category);
  console.log('📦 Current products state:', products);
  console.log('📊 Products count:', products.length);

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
