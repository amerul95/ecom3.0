'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export function NavbarWrapper() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return null;
  }

  return <Navbar />;
}
