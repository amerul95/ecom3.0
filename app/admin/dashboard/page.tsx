import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AdminDashboardClient } from './admin-dashboard-client';

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const userRole = (session.user as { role?: string }).role;
  if (userRole !== 'ADMIN') {
    redirect('/login?error=unauthorized');
  }

  const userId = session.user.id;
  if (!userId) {
    redirect('/login');
  }

  const products = await prisma.product.findMany({
    where: { sellerId: userId },
    include: {
      category: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const totalItems = products.length;
  const activeItems = products.filter((p) => p.stock > 0).length;
  const totalRevenue = 0;

  const productsForClient = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: Number(p.price),
    stock: p.stock,
    category: p.category ? { name: p.category.name } : null,
  }));

  return (
    <AdminDashboardClient
      products={productsForClient}
      totalItems={totalItems}
      activeItems={activeItems}
      totalRevenue={totalRevenue}
    />
  );
}
