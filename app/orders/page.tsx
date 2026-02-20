import { OrdersPage } from '@/views/Orders';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Suspense } from 'react';
import { OrdersListSkeleton } from '@/components/skeleton';

interface OrderItem {
  id: string;
  quantity: number;
  price: number | string;
  product: {
    id: string;
    name: string;
    images: string[];
    slug: string;
  };
  variant: {
    id: string;
    name: string;
  } | null;
}

interface Order {
  id: string;
  status: string;
  total: number | string;
  createdAt: string;
  items: OrderItem[];
  payment: {
    status: string;
  } | null;
  shipping: {
    address: string;
    city: string;
    state?: string;
    postal: string;
    country: string;
    tracking?: string;
  } | null;
}

async function OrdersContent({ userId }: { userId: string }) {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: { include: { category: true } },
          variant: true,
        },
      },
      payment: true,
      shipping: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const ordersForPage: Order[] = orders.map((o) => ({
    id: o.id,
    status: o.status,
    total: Number(o.total),
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((i) => ({
      id: i.id,
      quantity: i.quantity,
      price: Number(i.price),
      product: {
        id: i.product.id,
        name: i.product.name,
        images: (i.product.images as string[]) ?? [],
        slug: i.product.slug,
      },
      variant: i.variant
        ? { id: i.variant.id, name: i.variant.name }
        : null,
    })),
    payment: o.payment ? { status: o.payment.status } : null,
    shipping: o.shipping
      ? {
          address: o.shipping.address,
          city: o.shipping.city,
          state: o.shipping.state ?? undefined,
          postal: o.shipping.postal,
          country: o.shipping.country,
          tracking: o.shipping.tracking ?? undefined,
        }
      : null,
  }));

  return <OrdersPage orders={ordersForPage} />;
}

export default async function Orders() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return redirect('/login');
  }

  return (
    <Suspense fallback={<OrdersListSkeleton />}>
      <OrdersContent userId={session.user.id} />
    </Suspense>
  );
}

