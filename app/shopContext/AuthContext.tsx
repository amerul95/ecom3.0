'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useSession, signOut } from 'next-auth/react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { data: session, status } = useSession();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Update authentication state based on NextAuth session
  useEffect(() => {
    setIsAuthenticated(status === 'authenticated' && !!session);
  }, [session, status]);

  const login = (token: string) => {
    console.log("Logging in with token:", token);
    // This is kept for backward compatibility
    // Actual authentication is handled by NextAuth
    setIsAuthenticated(true);
  };

  const logout = async () => {
    console.log("Logging out...");
    await signOut({ 
      callbackUrl: '/',
      redirect: true 
    });
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

