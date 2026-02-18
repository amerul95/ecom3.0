'use client';

import Link from 'next/link';

interface BreadcrumbsProps {
  category?: string;
}

export function Breadcrumbs({ category }: BreadcrumbsProps) {
  return (
    <nav className="flex justify-center m-5" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
        <li className="inline-flex items-center">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-700">
            Home
          </Link>
        </li>
        {category && (
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
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Link>
            </div>
          </li>
        )}
      </ol>
    </nav>
  );
}
