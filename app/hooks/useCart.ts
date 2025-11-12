'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number | string;
    images: string[];
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

  // Fetch cart from database
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
      const response = await axios.get('/api/cart');
      setCart(response.data);
    } catch (err: any) {
      // Handle 401 (unauthorized) gracefully - just show empty cart
      if (err.response?.status === 401) {
        setCart({
          items: [],
          total: '0.00',
          itemCount: 0,
        });
        // Don't set error for 401 - it's expected for unauthenticated users
      } else {
        console.error('Failed to fetch cart:', err);
        setError('Failed to load cart');
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

  // Add item to cart
  const addToCart = useCallback(async (productId: string, quantity: number = 1, variantId?: string) => {
    if (status !== 'authenticated') {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
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
    } catch (err: any) {
      console.error('Failed to add to cart:', err);
      if (err.response?.status === 401) {
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      } else {
        setError(err.response?.data?.error || 'Failed to add to cart');
      }
      return false;
    }
  }, [status, router, fetchCart]);

  // Update cart item quantity
  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    try {
      setError(null);
      await axios.patch(`/api/cart/${itemId}`, { quantity });
      await fetchCart();
      return true;
    } catch (err: any) {
      console.error('Failed to update cart item:', err);
      setError(err.response?.data?.error || 'Failed to update quantity');
      return false;
    }
  }, [fetchCart]);

  // Remove item from cart
  const removeItem = useCallback(async (itemId: string) => {
    try {
      setError(null);
      await axios.delete(`/api/cart/${itemId}`);
      await fetchCart();
      return true;
    } catch (err: any) {
      console.error('Failed to remove cart item:', err);
      setError(err.response?.data?.error || 'Failed to remove item');
      return false;
    }
  }, [fetchCart]);

  // Clear entire cart
  const clearCart = useCallback(async () => {
    if (cart.items.length === 0) return true;

    try {
      setError(null);
      await Promise.all(cart.items.map(item => axios.delete(`/api/cart/${item.id}`)));
      await fetchCart();
      return true;
    } catch (err: any) {
      console.error('Failed to clear cart:', err);
      setError('Failed to clear cart');
      return false;
    }
  }, [cart, fetchCart]);

  return {
    cart,
    isLoading,
    error,
    itemCount: cart.itemCount,
    total: cart.total,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart: fetchCart,
  };
}







