import { headers } from 'next/headers';
import { Suspense } from 'react';
import { EditProductForm } from '@/components/products';
import { NotFound } from '@/components/products/notfound';
import { EditProductFormSkeleton } from '@/components/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import type { Category, ProductResponse } from '@/components/products/types';

async function getCategories() {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;

  const res = await fetch(`${baseUrl}/api/categories`, {
    cache: 'no-store',
    headers: { cookie: headersList.get('cookie') ?? '' },
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return (data.categories || []) as Category[];
}

async function getProduct(productId: string): Promise<{ product: ProductResponse['product'] | null; error: string | null }> {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;

  const res = await fetch(`${baseUrl}/api/admin/products/${productId}`, {
    cache: 'no-store',
    headers: { cookie: headersList.get('cookie') ?? '' },
  });

  if (!res.ok) {
    if (res.status === 404) {
      return { product: null, error: null };
    }
    try {
      const errorData = await res.json();
      return { product: null, error: errorData.error || 'Failed to fetch product. Please try again.' };
    } catch {
      return { product: null, error: 'Failed to fetch product. Please try again.' };
    }
  }

  const data: ProductResponse = await res.json();
  return { product: data.product, error: null };
}

async function ProductFormFromApi({ productId, categories }: { productId: string; categories: Category[] }) {
  const { product, error } = await getProduct(productId);

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <p className="text-sm text-destructive whitespace-pre-line">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!product) {
    return <NotFound />;
  }

  return <EditProductForm product={product} categories={categories} />;
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const productId = Array.isArray(resolvedParams.id) ? resolvedParams.id[0] : resolvedParams.id;
  const categories = await getCategories();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Edit product</h1>
          <p className="text-muted-foreground">Update details and save.</p>
        </div>

        <Suspense fallback={<EditProductFormSkeleton />}>
          <ProductFormFromApi productId={productId} categories={categories} />
        </Suspense>
      </div>
    </div>
  );
}
