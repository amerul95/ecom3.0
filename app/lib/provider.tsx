'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '../shopContext/AuthContext';
import ShopContextProvider from '../shopContext/ShopContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <ShopContextProvider>
          {children}
        </ShopContextProvider>
      </AuthProvider>
    </SessionProvider>
  );
}

