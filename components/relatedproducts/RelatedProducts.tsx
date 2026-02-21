'use client';

import React, { useContext, useState } from 'react';
import Link from 'next/link';
import { ShopContext } from '@/shopContext/ShopContext';
import { useParams } from 'next/navigation';
import { Loading } from '../loader/Loading';
import useFetchData from '@/shopContext/UseFetchData';
import { ErrorCpnt } from '../error/ErrorCpnt';

interface ApiProduct {
  id: string;
  name: string;
  price: number;
  slug: string;
  images: string[];
  category?: { slug: string; name: string } | null;
}

interface ProductsResponse {
  products: ApiProduct[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export const RelatedProducts: React.FC = () => {
  const shopContext = useContext(ShopContext);
  if (!shopContext) {
    throw new Error('RelatedProducts must be used within ShopContextProvider');
  }
  const { addToCart } = shopContext;
  const params = useParams();
  const category = params?.category as string | undefined;
  const itemID = params?.itemID as string | undefined;
  const apiUrl = `/api/products?categorySlug=${category || ''}&limit=20`;
  const { datas, isLoading, error } = useFetchData<ProductsResponse>(apiUrl);
  const [visibleItems, setVisibleItems] = useState<number>(4);

  const products = datas?.products ?? [];

  if (isLoading) return <Loading />;
  if (error) return <ErrorCpnt />;

  const handleAddToCart = (product: ApiProduct) => {
    addToCart(product.id, 1, '', '', {
      name: product.name,
      price: product.price,
      image: product.images?.[0],
      category: product.category?.slug ?? product.category?.name,
    });
  };

  const handleSeeMore = () => {
    setVisibleItems(prevVisibleItems => prevVisibleItems + 4);
  };

  const truncateName = (name: string, wordLimit: number): string => {
    const words = name.split(" ");
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(" ") + "...";
    }
    return name;
  };

  const filteredProducts = products.filter(
    (product) => product.id !== itemID && product.slug !== itemID
  );

  return (
    <div className='max-w-44'>
      <h3 className='text-lg font-semibold mt-2 mb-5'>RELATED PRODUCTS</h3>
      {filteredProducts.slice(0, visibleItems).map((product) => {
        const firstImage = product.images?.[0] || '/images/placeholder.png';
        return (
          <div key={product.id} className='flex mb-5'>
            <Link href={`/product/${product.slug}`}>
              <img
                src={firstImage}
                alt={product.name}
                className='border border-gray-500 rounded w-24 h-24 object-cover'
              />
            </Link>
            <div className='flex flex-col justify-evenly'>
              <p className='ml-3 text-base font-medium leading-4'>
                {truncateName(product.name ?? '', 2)}
              </p>
              <p className='ml-3 text-base font-medium'>RM {product.price}</p>
              <button
                onClick={() => handleAddToCart(product)}
                className='text-xs bg-pink-900 text-white rounded ml-3 w-20 py-1'>
                Add to cart
              </button>
            </div>
          </div>
        );
      })}
      <div className='text-center'>
      {visibleItems < filteredProducts.length && (
        <button
          onClick={handleSeeMore}
          className='mt-5 text-xs py-1 bg-pink-800 text-white rounded-lg font-medium px-2'>
          See More
        </button>
      )}
      </div>
      <hr className='mt-5' />
    </div>
  );
};
