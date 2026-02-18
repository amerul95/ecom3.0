'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import type { CartData, CartItem } from '@/types';

/**
 * Custom hook for managing shopping cart
 * Handles fetching, adding, updating, and removing cart items
 * 
 * @returns Cart state and operations
 */

export function useCart() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [cart, setCart] = useState<CartData>({
    items: [],
    total: '0.00',
    itemCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch cart from database
   * Handles authentication state and errors gracefully
   */
  const fetchCart = useCallback(async () => {
    if (status !== 'authenticated') {
      // Set empty cart for unauthenticated users
      setCart({
        items: [],
        total: '0.00',
        itemCount: 0,
      });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get<CartData>('/api/cart');
      setCart(response.data);
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      
      // Handle 401 (unauthorized) gracefully - just show empty cart
      if (axiosError.response?.status === 401) {
        setCart({
          items: [],
          total: '0.00',
          itemCount: 0,
        });
        // Don't set error for 401 - it's expected for unauthenticated users
      } else {
        console.error('Failed to fetch cart:', axiosError);
        const errorMessage = axiosError.response?.data?.error || 'Failed to load cart';
        setError(errorMessage);
        // Set empty cart on other errors too
        setCart({
          items: [],
          total: '0.00',
          itemCount: 0,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  // Fetch cart on mount and when session changes
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  /**
   * Add item to cart
   * @param productId - Product ID to add
   * @param quantity - Quantity to add (default: 1)
   * @param variantId - Optional variant ID
   * @returns true if successful, false otherwise
   */
  const addToCart = useCallback(async (
    productId: string,
    quantity: number = 1,
    variantId?: string
  ): Promise<boolean> => {
    if (status !== 'authenticated') {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return false;
    }

    if (!productId || quantity <= 0) {
      setError('Invalid product or quantity');
      return false;
    }

    try {
      setError(null);
      await axios.post('/api/cart', {
        productId,
        quantity,
        variantId,
      });
      // Refresh cart after adding
      await fetchCart();
      return true;
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      console.error('Failed to add to cart:', axiosError);
      
      if (axiosError.response?.status === 401) {
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      } else {
        const errorMessage = axiosError.response?.data?.error || 'Failed to add to cart';
        setError(errorMessage);
      }
      return false;
    }
  }, [status, router, fetchCart]);

  /**
   * Update cart item quantity
   * @param itemId - Cart item ID
   * @param quantity - New quantity
   * @returns true if successful, false otherwise
   */
  const updateQuantity = useCallback(async (itemId: string, quantity: number): Promise<boolean> => {
    if (!itemId || quantity <= 0) {
      setError('Invalid item or quantity');
      return false;
    }

    try {
      setError(null);
      await axios.patch(`/api/cart/${itemId}`, { quantity });
      await fetchCart();
      return true;
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      console.error('Failed to update cart item:', axiosError);
      const errorMessage = axiosError.response?.data?.error || 'Failed to update quantity';
      setError(errorMessage);
      return false;
    }
  }, [fetchCart]);

  /**
   * Remove item from cart
   * @param itemId - Cart item ID to remove
   * @returns true if successful, false otherwise
   */
  const removeItem = useCallback(async (itemId: string): Promise<boolean> => {
    if (!itemId) {
      setError('Invalid item ID');
      return false;
    }

    try {
      setError(null);
      await axios.delete(`/api/cart/${itemId}`);
      await fetchCart();
      return true;
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      console.error('Failed to remove cart item:', axiosError);
      const errorMessage = axiosError.response?.data?.error || 'Failed to remove item';
      setError(errorMessage);
      return false;
    }
  }, [fetchCart]);

  /**
   * Clear entire cart
   * @returns true if successful, false otherwise
   */
  const clearCart = useCallback(async (): Promise<boolean> => {
    if (cart.items.length === 0) return true;

    try {
      setError(null);
      await Promise.all(cart.items.map(item => axios.delete(`/api/cart/${item.id}`)));
      await fetchCart();
      return true;
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      console.error('Failed to clear cart:', axiosError);
      const errorMessage = axiosError.response?.data?.error || 'Failed to clear cart';
      setError(errorMessage);
      return false;
    }
  }, [cart, fetchCart]);

  // Memoized computed values
  const totalAmount = useMemo(() => parseFloat(cart.total) || 0, [cart.total]);
  const isEmpty = useMemo(() => cart.items.length === 0, [cart.items.length]);

  return {
    cart,
    isLoading,
    error,
    itemCount: cart.itemCount,
    total: cart.total,
    totalAmount,
    isEmpty,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart: fetchCart,
  };
}







