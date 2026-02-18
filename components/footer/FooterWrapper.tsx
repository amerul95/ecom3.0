'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export function FooterWrapper() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return null;
  }

  return <Footer />;
}
