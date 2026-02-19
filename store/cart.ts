'use client';

import { create } from 'zustand';

/**
 * Cart data shape returned by GET /api/cart
 * API is source of truth; Zustand is cache.
 */
export interface CartItemFromApi {
  id: string;
  quantity: number;
  productId: string;
  variantId: string | null;
  product: {
    id: string;
    name: string;
    slug?: string;
    price: number | string;
    images?: string[];
    category?: { name: string } | null;
  };
  variant: {
    id: string;
    name: string;
    price: number | string | null;
  } | null;
}

export interface CartData {
  items: CartItemFromApi[];
  total: string;
  itemCount: number;
}

interface CartState {
  /** Server cart; null = not yet hydrated */
  cart: CartData | null;
  /** Optimistic delta for instant badge update before API responds */
  optimisticDelta: number;
  /** Hydrated once on app load */
  isHydrated: boolean;

  // Actions
  /** Replace entire state from server (after fetch or mutation) */
  replaceFromServer: (data: CartData | null) => void;
  /** Optimistic add — badge updates immediately */
  addOptimistic: (qty?: number) => void;
  /** Rollback optimistic on API error */
  rollback: () => void;
  /** Mark as hydrated after initial fetch */
  setHydrated: (v: boolean) => void;
}

export const useCartStore = create<CartState>((set) => ({
  cart: null,
  optimisticDelta: 0,
  isHydrated: false,

  replaceFromServer: (data) =>
    set({ cart: data, optimisticDelta: 0 }),

  addOptimistic: (qty = 1) =>
    set((s) => ({ optimisticDelta: s.optimisticDelta + qty })),

  rollback: () =>
    set({ optimisticDelta: 0 }),

  setHydrated: (v) =>
    set({ isHydrated: v }),
}));

/** Selector: total item count (server + optimistic) */
export const useCartCount = () =>
  useCartStore((s) => (s.cart?.itemCount ?? 0) + s.optimisticDelta);
