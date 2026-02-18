'use client';

import Link from 'next/link';

interface ErrorMessageProps {
  error: string;
  category?: string;
}

export function ErrorMessage({ error, category }: ErrorMessageProps) {
  const isNotFound = error.includes("not found");

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
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            {isNotFound ? "Category Not Found" : "Error"}
          </h3>
          <p className="text-gray-500 mb-6">
            {isNotFound
              ? `The category "${category}" does not exist or has been removed.`
              : error}
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
