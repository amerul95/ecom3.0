'use client';

import { SessionProvider } from 'next-auth/react';
import ShopContextProvider from '@/shopContext/ShopContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
        <ShopContextProvider>
          {children}
        </ShopContextProvider>
    </SessionProvider>
  );
}
