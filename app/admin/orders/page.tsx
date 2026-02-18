import { headers } from "next/headers";
import { Suspense } from "react";
import { OrdersTable } from "./OrdersTable";
import { OrdersTableSkeleton } from "@/components/skeleton";

async function getOrders() {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const baseUrl = `${protocol}://${host}`;

  const res = await fetch(`${baseUrl}/api/admin/orders?limit=100`, {
    cache: "no-store",
    headers: { cookie: headersList.get("cookie") ?? "" },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch orders");
  }

  const data = await res.json();
  return data.orders ?? [];
}

async function OrdersTableFromApi() {
  const orders = await getOrders();
  return <OrdersTable orders={orders} />;
}

export default async function AdminOrdersPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">View and update order status</p>
        </div>
        <Suspense fallback={<OrdersTableSkeleton />}>
          <OrdersTableFromApi />
        </Suspense>
      </div>
    </div>
  );
}
