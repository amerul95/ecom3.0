'use client';

import React, { useContext, useState } from 'react';
import { ShopContext } from '../../shopContext/ShopContext';
import { useParams } from 'next/navigation';
import { Loading } from '../loader/Loading';
import useFetchData from '../../shopContext/UseFetchData';
import { ErrorCpnt } from '../error/ErrorCpnt';
import { Product } from '../../shopContext/ShopContext';

interface ProductWithDetails extends Product {
  truncated_name?: string;
  first_image_path?: string;
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
  const apiUrl = category ? `https://backend-run-79be31c2d90c.herokuapp.com/products/${category}` : 'https://backend-run-79be31c2d90c.herokuapp.com/products';
  const { datas, isLoading, error } = useFetchData<Product[]>(apiUrl);
  const [visibleItems, setVisibleItems] = useState<number>(4);

  if (isLoading) return <Loading />;
  if (error) return <ErrorCpnt />;

  const handleAddToCart = (itemId: number) => {
    addToCart(itemId);
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

  const products: ProductWithDetails[] = (datas || [])
    .filter(product => product.id !== parseInt(itemID || '0', 10))
    .map(product => ({
      ...product,
      truncated_name: truncateName(product.name, 2),
      first_image_path: product.image_paths ? product.image_paths.split(',')[0].trim() : '',
    }));

  return (
    <div className='max-w-44'>
      <h3 className='text-lg font-semibold mt-2 mb-5'>RELATED PRODUCTS</h3>
      {products.slice(0, visibleItems).map(product => (
        <div key={product.id} className='flex mb-5'>
          <img 
            src={`https://backend-run-79be31c2d90c.herokuapp.com/images/${category}/${product.first_image_path}`} 
            alt={product.name} 
            className='border border-gray-500 rounded w-24 h-24' 
          />
          <div className='flex flex-col justify-evenly'>
            <p className='ml-3 text-base font-medium leading-4'>{product.truncated_name}</p>
            <p className='ml-3 text-base font-medium'>S${product.new_price}</p>
            <button 
              onClick={() => handleAddToCart(product.id)} 
              className='text-xs bg-pink-900 text-white rounded ml-3 w-20 py-1'>
              Add to cart
            </button>
          </div>
        </div>
      ))}
      <div className='text-center'>
      {visibleItems < products.length && (
        <button onClick={handleSeeMore} className='mt-5 text-xs py-1 bg-pink-800 text-white rounded-lg font-medium px-2'>
          See More
        </button>
      )}
      </div>
      <hr className='mt-5' />
    </div>
  );
};
