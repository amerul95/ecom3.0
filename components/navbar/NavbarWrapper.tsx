'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import type { NavbarCategory } from '@/lib/navbar-categories';

interface NavbarWrapperProps {
  categories: NavbarCategory[];
}

export function NavbarWrapper({ categories }: NavbarWrapperProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return null;
  }

  return <Navbar categories={categories} />;
}
