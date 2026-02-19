'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { useCartStore, type CartData } from '@/store/cart';

export function CartHydrator() {
  const { status } = useSession();
  const hasHydrated = useRef(false);
  const replaceFromServer = useCartStore((s) => s.replaceFromServer);
  const setHydrated = useCartStore((s) => s.setHydrated);

  useEffect(() => {
    if (status !== 'authenticated') {
      hasHydrated.current = false;
      replaceFromServer(null);
      setHydrated(true);
      return;
    }

    if (hasHydrated.current) return;
    hasHydrated.current = true;

    const hydrate = async () => {
      try {
        const res = await axios.get<CartData>('/api/cart');
        replaceFromServer(res.data);
      } catch {
        replaceFromServer({ items: [], total: '0.00', itemCount: 0 });
      } finally {
        setHydrated(true);
      }
    };

    hydrate();
  }, [status, replaceFromServer, setHydrated]);

  return null;
}
