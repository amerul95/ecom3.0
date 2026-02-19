'use client';

import { SessionProvider } from 'next-auth/react';
import ShopContextProvider from '@/shopContext/ShopContext';
import { CartHydrator } from '@/components/cart/CartHydrator';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
        <ShopContextProvider>
          <CartHydrator />
          {children}
        </ShopContextProvider>
    </SessionProvider>
  );
}
