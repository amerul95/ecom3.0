'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { useSession } from 'next-auth/react';

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
}

interface CardProps {
  data: Product;
}

// Helper function to format price (handles Prisma Decimal)
function formatPrice(price: number | string): string {
  if (typeof price === 'number') {
    return price.toFixed(2);
  }
  if (typeof price === 'string') {
    return parseFloat(price).toFixed(2);
  }
  return '0.00';
}

export const Card: React.FC<CardProps> = ({ data }) => {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const category = params?.category as string | undefined;
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  
  // Get the first image from the images array
  const firstImage = data.images && data.images.length > 0 ? data.images[0] : '';
  const price = formatPrice(data.price);
  const isOutOfStock = data.stock <= 0;
  const isAuthenticated = status === 'authenticated';

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    if (isOutOfStock) {
      setCartMessage('Out of stock');
      setTimeout(() => setCartMessage(null), 2000);
      return;
    }

    try {
      setIsAddingToCart(true);
      setCartMessage(null);

      const response = await axios.post('/api/cart', {
        productId: data.id,
        quantity: 1,
      });

      if (response.status === 201 || response.status === 200) {
        setCartMessage('Added to cart!');
        setTimeout(() => setCartMessage(null), 2000);
      }
    } catch (error: any) {
      console.error('Failed to add to cart:', error);
      if (error.response?.status === 401) {
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      } else {
        setCartMessage(error.response?.data?.error || 'Failed to add to cart');
        setTimeout(() => setCartMessage(null), 3000);
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    if (isOutOfStock) {
      setCartMessage('Out of stock');
      setTimeout(() => setCartMessage(null), 2000);
      return;
    }

    try {
      setIsBuyingNow(true);
      setCartMessage(null);

      // Add to cart first, then redirect to checkout
      const response = await axios.post('/api/cart', {
        productId: data.id,
        quantity: 1,
      });

      if (response.status === 201 || response.status === 200) {
        // Redirect to checkout
        router.push('/checkout');
      }
    } catch (error: any) {
      console.error('Failed to add to cart:', error);
      if (error.response?.status === 401) {
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      } else {
        setCartMessage(error.response?.data?.error || 'Failed to process');
        setTimeout(() => setCartMessage(null), 3000);
      }
    } finally {
      setIsBuyingNow(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 border border-gray-100">
      <Link href={`/product/${data.slug}`}>
        <div className="w-full aspect-square bg-gray-100 overflow-hidden">
          {firstImage ? (
            <img 
              className="w-full h-full object-cover" 
              src={firstImage} 
              alt={data.name}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/images/placeholder.png'; // Fallback image
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-sm">No Image</span>
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col justify-between min-h-[180px]">
          <p className="mb-2 text-sm md:text-base font-semibold text-gray-800 line-clamp-2 h-12">
            {data.name}
          </p>
          <div>
            <div className="mb-2">
              {data.stock > 0 ? (
                <span className="text-xs text-green-600 font-medium">In Stock</span>
              ) : (
                <span className="text-xs text-red-600 font-medium">Out of Stock</span>
              )}
            </div>
            <p className="text-base md:text-lg font-bold text-indigo-600 mb-3">S$ {price}</p>
            {data.category && (
              <p className="text-xs text-gray-500 mb-3">{data.category.name}</p>
            )}
          </div>
        </div>
      </Link>
      
      {/* Action Buttons */}
      <div className="px-4 pb-4 space-y-2" onClick={(e) => e.stopPropagation()}>
        {cartMessage && (
          <div className="mb-2 text-xs text-center">
            <span className={`px-2 py-1 rounded ${
              cartMessage.includes('Added') || cartMessage.includes('success')
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {cartMessage}
            </span>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={handleBuyNow}
            disabled={isOutOfStock || isBuyingNow || isAddingToCart}
            className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isBuyingNow ? 'Processing...' : 'Buy Now'}
          </button>
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAddingToCart || isBuyingNow}
            className="flex-1 px-3 py-2 bg-white text-indigo-600 text-sm font-medium rounded-lg border-2 border-indigo-600 hover:bg-indigo-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isAddingToCart ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};
