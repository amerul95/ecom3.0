import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function NotFound() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Product not found</CardTitle>
        <CardDescription>The product you're looking for doesn't exist or has been removed.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href="/admin/products">Back to products</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
