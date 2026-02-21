'use client';

import Link from 'next/link';
import { formatPrice } from '@/lib/helpers';
import { DeleteButton } from '@/components/delete-button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface ManagerListProductItem {
  id: string;
  name: string;
  slug: string;
  price: number | string | { toString: () => string };
  stock: number;
  images: string[];
  category: { name: string } | null;
  _count: { reviews: number; orderItems: number };
}

type ManagerListProductProps = {
  products: ManagerListProductItem[];
  // onStatusMessage: (message: { type: 'success' | 'error'; text: string }) => void;
};

const ImagePlaceholder = () => (
  <div className="w-full h-48 flex items-center justify-center bg-muted/50 dark:bg-muted/30">
    <svg
      className="w-16 h-16 text-muted-foreground"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  </div>
);

export function ManagerListProduct({ products}: ManagerListProductProps) {
  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No products yet</CardTitle>
          <CardDescription>Create your first product to get started.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild>
            <Link href="/admin/products/new">Create Your First Product</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => {
        const firstImage = product.images?.length ? product.images[0] : null;
        return (
          <Card key={product.id} className="overflow-hidden">
            <div className="w-full h-48 bg-muted/50 flex items-center justify-center overflow-hidden">
              {firstImage ? (
                <img
                  src={firstImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      target.parentElement.innerHTML =
                        '<div class="w-full h-48 flex items-center justify-center bg-muted/50 dark:bg-muted/30"><svg class="w-16 h-16 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                    }
                  }}
                />
              ) : (
                <ImagePlaceholder />
              )}
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{product.name}</CardTitle>
              <p className="text-2xl font-bold text-primary">
                RM {formatPrice(product.price)}
              </p>
              <CardDescription className="flex justify-between text-sm">
                <span>Stock: {product.stock}</span>
                <span>{product.category?.name || 'Uncategorized'}</span>
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link href={`/admin/products/${product.id}/edit`}>Edit</Link>
              </Button>
              <DeleteButton
                productId={product.id}
                productName={product.name}
              />
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
