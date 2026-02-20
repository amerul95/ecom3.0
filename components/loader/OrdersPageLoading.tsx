import { OrdersListSkeleton } from '@/components/skeleton';

/**
 * Reusable orders page loading component.
 * Use as Suspense fallback instead of route-level loading.tsx.
 */
export function OrdersPageLoading() {
  return <OrdersListSkeleton />;
}
