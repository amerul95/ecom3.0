'use client';

import Link from 'next/link';
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SectionCards } from "@/components/section-cards";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type DashboardProduct = {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  stock: number;
  category: { name: string } | null;
};

type AdminDashboardClientProps = {
  products: DashboardProduct[];
  totalItems: number;
  activeItems: number;
  totalRevenue: number;
};

function formatPrice(price: number | string): string {
  const n = typeof price === 'number' ? price : parseFloat(String(price));
  return Number.isNaN(n) ? '0.00' : n.toFixed(2);
}

export function AdminDashboardClient({
  products,
  totalItems,
  activeItems,
  totalRevenue,
}: AdminDashboardClientProps) {
  const recentProducts = products.slice(0, 5);

  return (
    <div className="@container/main flex flex-1 flex-col gap-2 bg-background">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
        <SectionCards
                totalProducts={totalItems}
                activeProducts={activeItems}
                totalRevenue={totalRevenue}
              />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl font-semibold leading-none tracking-tight">
                      Recent Products
                    </CardTitle>
                    <CardDescription>
                      Latest products in your store
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentProducts.length > 0 ? (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead className="text-right">Stock</TableHead>
                              <TableHead className="text-right">Price</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {recentProducts.map((product) => (
                              <TableRow key={product.id}>
                                <TableCell className="font-medium">
                                  {product.name}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {product.category?.name ?? 'Uncategorized'}
                                </TableCell>
                                <TableCell className="text-right">
                                  {product.stock}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  S$ {formatPrice(product.price)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {products.length > 5 && (
                          <div className="mt-4">
                            <Link
                              href="/admin/products"
                              className="text-sm text-primary hover:underline"
                            >
                              View all {products.length} products →
                            </Link>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                        <p>
                          No products yet.{' '}
                          <Link
                            href="/admin/products/new"
                            className="text-primary hover:underline"
                          >
                            Create your first product
                          </Link>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
  );
}
