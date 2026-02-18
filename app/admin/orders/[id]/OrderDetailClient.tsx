"use client";

import { useState } from "react";
import axios from "axios";

const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];

type Order = {
  id: string;
  status: OrderStatus;
  total: string | number;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: string | number;
    product: {
      id: string;
      name: string;
      slug: string;
      category?: { name: string } | null;
    };
    variant?: { name: string; sku: string } | null;
  }>;
  payment?: { id: string; status: string } | null;
  shipping?: {
    address?: string;
    city?: string;
    state?: string;
    postal?: string;
    country?: string;
  } | null;
};

export function OrderDetailClient({ order: initialOrder }: { order: Order }) {
  const [order, setOrder] = useState(initialOrder);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    setError(null);
    setUpdating(true);
    try {
      const res = await axios.patch(`/api/admin/orders/${order.id}`, {
        status: newStatus,
      });
      setOrder(res.data.order);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  const formatTotal = (t: string | number) => {
    const n = typeof t === "string" ? parseFloat(t) : t;
    return isNaN(n) ? String(t) : `$${n.toFixed(2)}`;
  };
  const formatPrice = (t: string | number) => {
    const n = typeof t === "string" ? parseFloat(t) : t;
    return isNaN(n) ? String(t) : `$${n.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Order {order.id.slice(0, 8)}…</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="status" className="text-sm text-muted-foreground">
            Status
          </label>
          <select
            id="status"
            value={order.status}
            onChange={(e) =>
              handleStatusChange(e.target.value as OrderStatus)
            }
            disabled={updating}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Customer</h2>
        <p className="text-sm">
          {order.user?.name || "—"} ({order.user?.email || "—"})
        </p>
        <p className="text-xs text-muted-foreground">ID: {order.user?.id}</p>
      </div>

      {order.shipping && (
        <div className="rounded-lg border bg-card p-6 space-y-2">
          <h2 className="font-semibold">Shipping</h2>
          <p className="text-sm">
            {[
              order.shipping.address,
              order.shipping.city,
              order.shipping.state,
              order.shipping.postal,
              order.shipping.country,
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>
      )}

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Items</h2>
        <ul className="space-y-2">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex justify-between items-center py-2 border-b last:border-0"
            >
              <div>
                <span className="font-medium">{item.product.name}</span>
                {item.product.slug && (
                  <span className="text-muted-foreground text-xs ml-2">
                    /{item.product.slug}
                  </span>
                )}
                {item.variant && (
                  <span className="text-muted-foreground text-xs block">
                    {item.variant.name} ({item.variant.sku})
                  </span>
                )}
              </div>
              <div className="text-right text-sm">
                {item.quantity} × {formatPrice(item.price)} ={" "}
                {formatPrice(
                  (typeof item.price === "string"
                    ? parseFloat(item.price)
                    : item.price) * item.quantity
                )}
              </div>
            </li>
          ))}
        </ul>
        <p className="font-semibold text-right pt-2">
          Total: {formatTotal(order.total)}
        </p>
      </div>

      <div className="text-sm text-muted-foreground">
        Placed: {formatDate(order.createdAt)}
        {order.payment && (
          <span className="ml-4">Payment: {order.payment.status}</span>
        )}
      </div>
    </div>
  );
}
