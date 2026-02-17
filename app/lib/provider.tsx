'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '../shopContext/AuthContext';
import ShopContextProvider from '../shopContext/ShopContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SessionProvider>
        <AuthProvider>
          <ShopContextProvider>
            {children}
          </ShopContextProvider>
        </AuthProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

