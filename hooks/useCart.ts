'use client';

import { useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import { useCartStore, useCartCount, type CartData } from '@/store/cart';

/**
 * Production-grade add-to-cart flow:
 * Optimistic update → API call → Replace Zustand with server response.
 * API is source of truth; Zustand is cache.
 */
export function useCart() {
  const router = useRouter();
  const { status } = useSession();
  const cart = useCartStore((s) => s.cart);
  const addOptimistic = useCartStore((s) => s.addOptimistic);
  const replaceFromServer = useCartStore((s) => s.replaceFromServer);
  const rollback = useCartStore((s) => s.rollback);
  const itemCount = useCartCount();
  const total = cart?.total ?? '0.00';
  const items = cart?.items ?? [];
  const isHydrated = useCartStore((s) => s.isHydrated);

  const addToCart = useCallback(
    async (
      productId: string,
      quantity: number = 1,
      variantId?: string
    ): Promise<{ ok: boolean; error?: string }> => {
      if (status !== 'authenticated') {
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
        return { ok: false };
      }

      if (!productId || quantity <= 0) {
        return { ok: false, error: 'Invalid product or quantity' };
      }

      addOptimistic(quantity);

      try {
        const res = await axios.post<CartData>('/api/cart', {
          productId,
          quantity,
          variantId,
        });
        replaceFromServer(res.data);
        return { ok: true };
      } catch (err) {
        rollback();
        const axiosError = err as AxiosError<{ error?: string }>;
        if (axiosError.response?.status === 401) {
          router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
          return { ok: false };
        }
        const msg = axiosError.response?.data?.error || 'Failed to add to cart';
        return { ok: false, error: msg };
      }
    },
    [status, router, addOptimistic, replaceFromServer, rollback]
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number): Promise<{ ok: boolean; error?: string }> => {
      if (!itemId || quantity <= 0) {
        return { ok: false, error: 'Invalid item or quantity' };
      }

      try {
        const res = await axios.patch<CartData>(`/api/cart/${itemId}`, { quantity });
        replaceFromServer(res.data);
        return { ok: true };
      } catch (err) {
        const axiosError = err as AxiosError<{ error?: string }>;
        const msg = axiosError.response?.data?.error || 'Failed to update quantity';
        return { ok: false, error: msg };
      }
    },
    [replaceFromServer]
  );

  const removeItem = useCallback(
    async (itemId: string): Promise<{ ok: boolean; error?: string }> => {
      if (!itemId) return { ok: false, error: 'Invalid item ID' };

      try {
        const res = await axios.delete<CartData>(`/api/cart/${itemId}`);
        replaceFromServer(res.data);
        return { ok: true };
      } catch (err) {
        const axiosError = err as AxiosError<{ error?: string }>;
        const msg = axiosError.response?.data?.error || 'Failed to remove item';
        return { ok: false, error: msg };
      }
    },
    [replaceFromServer]
  );

  const refreshCart = useCallback(async () => {
    if (status !== 'authenticated') return;
    try {
      const res = await axios.get<CartData>('/api/cart');
      replaceFromServer(res.data);
    } catch {
      replaceFromServer({ items: [], total: '0.00', itemCount: 0 });
    }
  }, [status, replaceFromServer]);

  const clearCart = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (!cart || cart.items.length === 0) return { ok: true };

    try {
      await Promise.all(cart.items.map((item) => axios.delete(`/api/cart/${item.id}`)));
      replaceFromServer({ items: [], total: '0.00', itemCount: 0 });
      return { ok: true };
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      const msg = axiosError.response?.data?.error || 'Failed to clear cart';
      return { ok: false, error: msg };
    }
  }, [cart, replaceFromServer]);

  return {
    cart: cart ?? { items: [], total: '0.00', itemCount: 0 },
    itemCount,
    total,
    items,
    isHydrated,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart,
  };
}
