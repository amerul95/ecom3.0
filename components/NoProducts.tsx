'use client';

import Link from 'next/link';

interface NoProductsProps {
  category?: string;
}

export function NoProducts({ category }: NoProductsProps) {
  return (
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
  );
}
