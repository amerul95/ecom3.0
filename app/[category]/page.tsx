import { Suspense } from 'react';
import { getProducts } from '@/server/dal/product.dal';
import { prisma } from '@/lib/prisma';
import { ensureDefaultCategories } from '@/lib/default-categories';
import type { ProductListResponse } from '@/server/dto/product.dto';
import { NoProducts } from '@/components/NoProducts';
import { ErrorMessage } from '@/components/ErrorMessage';
import { ProductGrid } from '@/components/ProductGrid';
import { ProductListHeader } from '@/components/ProductListHeader';
import { ProductGridSkeleton } from '@/components/skeleton';

interface CategoryPageProps {
  params: Promise<{ category?: string }>;
  searchParams: Promise<{ search?: string; sort?: string }>;
}

/** Fetches products (depends on search) - suspends on search change so only grid shows loading */
async function ProductsGridContent({
  categoryId,
  search,
  category,
}: {
  categoryId: string | undefined;
  search: string | undefined;
  category: string | undefined;
}) {
  const result: ProductListResponse = await getProducts({
    categoryId: categoryId || undefined,
    search: search || undefined,
  });
  const products = result.products;

  return (
    <>
      <p className="text-center m-3">Showing {products.length} products</p>
      {products.length === 0 ? (
        <NoProducts category={category} />
      ) : (
        <ProductGrid products={products} />
      )}
    </>
  );
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category } = await params;
  const { search } = await searchParams;

  await ensureDefaultCategories();
  let categoryData: { id: string; name: string; slug: string } | null = null;

  if (category) {
    const record = await prisma.category.findUnique({ where: { slug: category } });
    if (!record) {
      return <ErrorMessage error={`Category "${category}" not found`} category={category} />;
    }
    categoryData = { id: record.id, name: record.name, slug: record.slug };
  }

  return (
    <div className="max-w-7xl px-2 mx-auto sm:px-6 lg:px-10 m-2 flex my-4 md:my-8 flex-col">
      <ProductListHeader category={category} categoryData={categoryData} />
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductsGridContent
          key={`${category ?? 'all'}-${search ?? ''}`}
          categoryId={categoryData?.id}
          search={search}
          category={category}
        />
      </Suspense>
    </div>
  );
}