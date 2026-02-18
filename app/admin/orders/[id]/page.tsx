import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderDetailClient } from "./OrderDetailClient";

async function getOrder(id: string) {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const baseUrl = `${protocol}://${host}`;

  const res = await fetch(`${baseUrl}/api/admin/orders/${id}`, {
    cache: "no-store",
    headers: { cookie: headersList.get("cookie") ?? "" },
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Failed to fetch order");
  }

  return res.json();
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) notFound();

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Orders
          </Link>
        </div>
        <OrderDetailClient order={order} />
      </div>
    </div>
  );
}
