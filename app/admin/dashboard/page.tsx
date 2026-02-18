import { headers } from 'next/headers';
import { Suspense } from 'react';
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { RecentProducts } from "@/components/recentProducts";
import { SectionCards } from "@/components/section-cards";
import { Skeleton } from "@/components/ui/skeleton";

async function getDashboardData() {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;

  const res = await fetch(`${baseUrl}/api/admin/dashboard`, {
    cache: 'no-store',
    headers: { cookie: headersList.get('cookie') ?? '' },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch dashboard data');
  }

  return res.json();
}

async function SectionCardsFromApi() {
  const { totalItems, activeItems, totalRevenue } = await getDashboardData();
  return (
    <SectionCards
      totalProducts={totalItems}
      activeProducts={activeItems}
      totalRevenue={totalRevenue}
    />
  );
}

async function RecentProductsFromApi() {
  const { products } = await getDashboardData();
  return <RecentProducts products={products} />;
}

function SectionCardsFallback() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-28 rounded-lg" />
      ))}
    </div>
  );
}

function ChartFallback() {
  return (
    <div className="px-4 lg:px-6">
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

function RecentProductsFallback() {
  return (
    <div className="px-4 lg:px-6 space-y-3">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <Suspense fallback={<SectionCardsFallback />}>
            <SectionCardsFromApi />
          </Suspense>
          <Suspense fallback={<ChartFallback />}>
            <ChartAreaInteractive />
          </Suspense>
          <Suspense fallback={<RecentProductsFallback />}>
            <RecentProductsFromApi />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
