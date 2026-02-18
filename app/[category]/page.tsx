import { Suspense } from 'react';
import { getProducts } from '@/server/dal/product.dal';
import { prisma } from '@/lib/prisma';
import { ensureDefaultCategories, DEFAULT_CATEGORIES } from '@/lib/default-categories';
import type { ProductListResponse } from '@/server/dto/product.dto';
import { NoProducts } from '@/components/NoProducts';
import { ErrorMessage } from '@/components/ErrorMessage';
import { ProductGrid } from '@/components/ProductGrid';
import { Loading } from '@/components/loader/Loading';
import { ProductListHeader } from '@/components/ProductListHeader';
import { ProductGridSkeleton } from '@/components/skeleton';

// Static generation: pre-render category pages at build time

interface CategoryPageProps {
  params: Promise<{ category?: string }>;
  searchParams: Promise<{ search?: string; sort?: string }>;
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category } = await params;
  const { search } = await searchParams;
  
  let products: ProductListResponse['products'] = [];
  let error: string | null = null;
  let categoryData: { id: string; name: string; slug: string } | null = null;

  try {
    await ensureDefaultCategories();

    if (category) {
      // Fetch category and products by category slug
      const categoryRecord = await prisma.category.findUnique({
        where: { slug: category },
      });

      if (!categoryRecord) {
        error = `Category "${category}" not found`;
      } else {
        categoryData = {
          id: categoryRecord.id,
          name: categoryRecord.name,
          slug: categoryRecord.slug,
        };

        // Fetch products using DAL - search param triggers server-side filtering
        const result: ProductListResponse = await getProducts({
          categoryId: categoryRecord.id,
          search: search || undefined,
        });
        products = result.products;
      }
    } else {
      // Fetch all products - search param triggers server-side filtering
      const result: ProductListResponse = await getProducts({
        search: search || undefined,
      });
      products = result.products;
    }
  } catch (err: any) {
    error = err.message || 'Failed to load products';
  }

  // Show error message
  if (error) {
    return (
      <Suspense fallback={<Loading />}>
        <ErrorMessage error={error} category={category} />
      </Suspense>
    );
  }

  return (
    <div className="max-w-7xl px-2 mx-auto sm:px-6 lg:px-10 m-2 flex my-4 md:my-8 flex-col">
      <Suspense fallback={<Loading />}>
        <ProductListHeader 
          category={category} 
          categoryData={categoryData} 
          productCount={products.length}
        />
      </Suspense>
      <Suspense fallback={<Loading />}>
      {products.length === 0 ? (

          <NoProducts category={category} />

      ) : (
        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductGrid products={products} />
        </Suspense>
      )}
      </Suspense>
    </div>
  );
}
