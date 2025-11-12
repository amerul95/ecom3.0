import type { Metadata } from 'next';
import { Figtree } from 'next/font/google';
import { Providers } from './lib/provider';
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
    <html lang="en" className={figtree.variable}>
      <body className={figtree.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

