import Link from "next/link";
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

export type RecentProduct = {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  stock: number;
  category: { name: string } | null;
};

function formatPrice(price: number | string): string {
  const n = typeof price === "number" ? price : parseFloat(String(price));
  return Number.isNaN(n) ? "0.00" : n.toFixed(2);
}

const DEFAULT_LIMIT = 5;

type RecentProductsProps = {
  products: RecentProduct[];
  limit?: number;
};

export function RecentProducts({ products, limit = DEFAULT_LIMIT }: RecentProductsProps) {
  const recentProducts = products.slice(0, limit);

  return (
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
                        {product.category?.name ?? "Uncategorized"}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.stock}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        RM {formatPrice(product.price)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {products.length > limit && (
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
                No products yet.{" "}
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
  );
}
