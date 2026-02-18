import type { Metadata } from 'next';
import { Figtree } from 'next/font/google';
import { Providers } from '@/lib/provider';
import { NavbarWrapper } from '@/components/navbar/NavbarWrapper';
import { FooterWrapper } from '@/components/footer/FooterWrapper';
import './globals.css';

const figtree = Figtree({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-figtree',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EcommBBM',
  description: 'BBM Ecommerce for Enterprise',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={figtree.variable} suppressHydrationWarning>
      <body className={figtree.className}>
        <Providers>
          <NavbarWrapper />
          {children}
          <FooterWrapper />
        </Providers>
      </body>
    </html>
  );
}
