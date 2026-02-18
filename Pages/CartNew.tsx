'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Link from 'next/link';

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number | string;
    images: string[];
    category: {
      name: string;
    } | null;
  };
  variant: {
    id: string;
    name: string;
    price: number | string | null;
  } | null;
}

interface CartData {
  items: CartItem[];
  total: string;
  itemCount: number;
}

// Helper function to format price
function formatPrice(price: number | string | null): string {
  if (price === null || price === undefined) return '0.00';
  if (typeof price === 'number') {
    return price.toFixed(2);
  }
  if (typeof price === 'string') {
    return parseFloat(price).toFixed(2);
  }
  return '0.00';
}

export const CartNew: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [cart, setCart] = useState<CartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Fetch cart items from database
  const fetchCart = async () => {
    if (status !== 'authenticated') return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get('/api/cart');
      setCart(response.data);
    } catch (err: any) {
      console.error('Failed to fetch cart:', err);
      if (err.response?.status === 401) {
        router.push('/login?redirect=' + encodeURIComponent('/carts'));
      } else {
        setError('Failed to load cart items');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=' + encodeURIComponent('/carts'));
      return;
    }

    if (status === 'authenticated') {
      fetchCart();
    }
  }, [status, router]);

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }

    try {
      setUpdatingItems(prev => new Set(prev).add(itemId));
      setError(null);

      await axios.patch(`/api/cart/${itemId}`, {
        quantity: newQuantity,
      });

      // Refresh cart after update
      await fetchCart();
    } catch (err: any) {
      console.error('Failed to update cart item:', err);
      setError(err.response?.data?.error || 'Failed to update quantity');
      setTimeout(() => setError(null), 3000);
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      setUpdatingItems(prev => new Set(prev).add(itemId));
      setError(null);

      await axios.delete(`/api/cart/${itemId}`);

      // Refresh cart after delete
      await fetchCart();
    } catch (err: any) {
      console.error('Failed to remove cart item:', err);
      setError(err.response?.data?.error || 'Failed to remove item');
      setTimeout(() => setError(null), 3000);
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleClearCart = async () => {
    if (!cart || cart.items.length === 0) return;

    if (!confirm('Are you sure you want to clear your cart?')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Delete all cart items
      await Promise.all(cart.items.map(item => axios.delete(`/api/cart/${item.id}`)));

      // Refresh cart
      await fetchCart();
    } catch (err: any) {
      console.error('Failed to clear cart:', err);
      setError('Failed to clear cart');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <svg
            className="mx-auto h-24 w-24 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add items to your cart to continue shopping</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
        {cart.items.length > 0 && (
          <button
            onClick={handleClearCart}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Clear Cart
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => {
            const price = item.variant?.price
              ? Number(item.variant.price)
              : Number(item.product.price);
            const itemTotal = price * item.quantity;
            const firstImage = item.product.images && item.product.images.length > 0
              ? item.product.images[0]
              : null;
            const isUpdating = updatingItems.has(item.id);

            return (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex gap-4">
                  {firstImage ? (
                    <img
                      src={firstImage}
                      alt={item.product.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No Image</span>
                    </div>
                  )}

                  <div className="flex-1">
                    <Link
                      href={`/product/${item.product.id}`}
                      className="text-lg font-semibold text-gray-900 hover:text-indigo-600"
                    >
                      {item.product.name}
                    </Link>
                    {item.variant && (
                      <p className="text-sm text-gray-600 mt-1">Variant: {item.variant.name}</p>
                    )}
                    {item.product.category && (
                      <p className="text-xs text-gray-500 mt-1">
                        {item.product.category.name}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-4">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={isUpdating || item.quantity <= 1}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          −
                        </button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          disabled={isUpdating}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>

                      {/* Price */}
                      <div className="flex-1 text-right">
                        <p className="text-lg font-bold text-indigo-600">
                          S$ {formatPrice(itemTotal)}
                        </p>
                        <p className="text-sm text-gray-500">
                          S$ {formatPrice(price)} each
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isUpdating}
                        className="text-red-600 hover:text-red-700 disabled:opacity-50"
                        title="Remove item"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({cart.itemCount} items)</span>
                <span>S$ {formatPrice(cart.total)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span className="text-indigo-600">S$ {formatPrice(cart.total)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="block w-full px-6 py-3 bg-indigo-600 text-white text-center rounded-lg hover:bg-indigo-700 font-medium transition-colors mb-4"
            >
              Proceed to Checkout
            </Link>

            <Link
              href="/"
              className="block text-center text-sm text-indigo-600 hover:text-indigo-700"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};







