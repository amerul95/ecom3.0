import { headers } from 'next/headers';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ManagerListProduct } from '@/components/managerListProduct';
import { ProductsListSkeleton } from '@/components/skeleton';
import { auth } from '@/lib/auth';

async function getProducts() {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;

  const res = await fetch(`${baseUrl}/api/admin/products`, {
    cache: 'no-store',
    headers: { cookie: headersList.get('cookie') ?? '' },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch products');
  }

  const data = await res.json();
  return data.products ?? [];
}

async function ProductsFromApi() {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== 'ADMIN') {
    return null;
  }
  const products = await getProducts();
  return <ManagerListProduct products={products} />;
}

export default async function AdminProductsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground">Manage product listings</p>
          </div>
          <Button asChild>
            <Link href="/admin/products/new">Add New Product</Link>
          </Button>
        </div>
        <Suspense fallback={<ProductsListSkeleton />}>
          <ProductsFromApi />
        </Suspense>
      </div>
    </div>
  );
}
