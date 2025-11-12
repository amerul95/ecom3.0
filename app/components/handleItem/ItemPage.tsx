'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ItemSlider from '../itemSlider/ItemSlider';
import { Details } from '../details/Details';
import { DiscoverMore } from '../discoverMore/DiscoverMore';
import { RelatedProducts } from '../relatedproducts/RelatedProducts';
import useFetchData from '../../shopContext/UseFetchData';
import { ErrorCpnt } from '../error/ErrorCpnt';
import { Loading } from '../loader/Loading';
import { Product } from '../../shopContext/ShopContext';

export const ItemPage: React.FC = () => {
  const params = useParams();
  const itemID = params?.itemID as string | undefined;
  const category = params?.category as string | undefined;
  const { datas, isLoading, error } = useFetchData<Product[]>('https://backend-run-79be31c2d90c.herokuapp.com/products');

  const capitalizeLetter = (string?: string): string => {
    return string ? string.charAt(0).toUpperCase() + string.slice(1) : '';
  };

  if (isLoading) return <Loading/>;
  if (error) return <ErrorCpnt/>;

  const item = datas ? datas.find(product => product.id === parseInt(itemID || '0', 10)) : null;

  if (!item) {
    return <div>Item not found</div>;
  }

  // Convert image_paths to an array and use the first image
  const images = item.image_paths ? item.image_paths.split(',').map(img => img.trim()) : [];

  return (
    <div className="max-w-7xl px-2 mx-auto sm:px-6 lg:px-10 m-2 my-4 md:my-8">
      <div>
        <nav className="flex justify-start m-5" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
            <li className="inline-flex items-center">
              <Link href={'/'} className="inline-flex items-center text-sm font-medium text-gray-700">
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
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 9 4-4-4-4"
                  />
                </svg>
                <Link href={`/${category}`} className="ms-1 text-sm font-medium text-gray-700">
                  {capitalizeLetter(category)}
                </Link>
              </div>
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
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 9 4-4-4-4"
                  />
                </svg>
                <Link href={`/${category}/${item.id}`} className="ms-1 text-sm font-medium text-gray-700">
                  {item.name}
                </Link>
              </div>
            </li>
          </ol>
        </nav>
        <p className="text-7xl text-black text-start">{capitalizeLetter(category)}</p>
        <hr className="w-44 mt-5 border-2 border-violet-700" />
      </div>
      <div className="flex flex-col lg:flex-row lg:Flex row justify-evenly">
        {images.length > 0 ? (
          <ItemSlider images={images} category={category} />
        ) : (
          <p className="w-96 text-center mt-5 py-5 text-2xl font-bold">No images available</p>
        )}
        <Details item={item} />
        <div className='hidden lg:block'>
        <RelatedProducts />
        </div>
      </div>
      <Link href="/" className="text-blue-500">&lt;BACK</Link>
      <div className="mx-auto text-center m-5">
        <DiscoverMore />
      </div>
    </div>
  );
};
