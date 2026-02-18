'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

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

// Helper function to format price
function formatPrice(price: number | string): string {
  if (typeof price === 'number') {
    return price.toFixed(2);
  }
  if (typeof price === 'string') {
    return parseFloat(price).toFixed(2);
  }
  return '0.00';
}

// Helper function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Helper function to get status color
function getStatusColor(status: string): string {
  const statusLower = status.toLowerCase();
  if (statusLower === 'pending') return 'bg-yellow-100 text-yellow-800';
  if (statusLower === 'processing') return 'bg-blue-100 text-blue-800';
  if (statusLower === 'shipped') return 'bg-purple-100 text-purple-800';
  if (statusLower === 'delivered') return 'bg-green-100 text-green-800';
  if (statusLower === 'cancelled') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
}

export const OrdersPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=' + encodeURIComponent('/orders'));
      return;
    }

    if (status === 'authenticated') {
      fetchOrders();
    }
  }, [status, router]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get('/api/orders');
      setOrders(response.data.orders || []);
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
      if (err.response?.status === 401) {
        router.push('/login?redirect=' + encodeURIComponent('/orders'));
      } else {
        setError('Failed to load orders');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchOrders}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg
            className="mx-auto h-24 w-24 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No orders yet</h2>
          <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const firstItem = order.items[0];
            const firstImage = firstItem?.product?.images?.[0] || null;

            return (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Order Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-500">Order ID:</span>
                        <span className="text-sm font-semibold text-gray-900">{order.id}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="text-sm text-gray-500">Placed on:</span>
                        <span className="text-sm text-gray-900">{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status.toUpperCase()}
                      </span>
                      <span className="text-lg font-bold text-indigo-600">
                        S$ {formatPrice(order.total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="px-6 py-4">
                  <div className="space-y-4">
                    {order.items.map((item) => {
                      const itemImage = item.product.images?.[0] || null;

                      return (
                        <div key={item.id} className="flex gap-4">
                          {itemImage ? (
                            <Link
                              href={`/product/${item.product.slug}`}
                              className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200"
                            >
                              <img
                                src={itemImage}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            </Link>
                          ) : (
                            <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                              <span className="text-xs text-gray-400">No Image</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/product/${item.product.slug}`}
                              className="text-base font-semibold text-gray-900 hover:text-indigo-600"
                            >
                              {item.product.name}
                            </Link>
                            {item.variant && (
                              <p className="text-sm text-gray-500 mt-1">Variant: {item.variant.name}</p>
                            )}
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-sm text-gray-500">Quantity: {item.quantity}</span>
                              <span className="text-sm font-semibold text-gray-900">
                                S$ {formatPrice(item.price)} each
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Shipping Info */}
                  {order.shipping && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Shipping Address</h4>
                      <p className="text-sm text-gray-600">
                        {order.shipping.address}, {order.shipping.city}
                        {order.shipping.state && `, ${order.shipping.state}`}
                        {', '}
                        {order.shipping.postal} {order.shipping.country}
                      </p>
                      {order.shipping.tracking && (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Tracking:</span> {order.shipping.tracking}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Payment Status */}
                  {order.payment && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">Payment Status</span>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${
                            order.payment.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : order.payment.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {order.payment.status}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-4 pt-4 border-t border-gray-200 flex gap-3">
                    <Link
                      href={`/orders/${order.id}`}
                      className="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      View Details
                    </Link>
                    {order.status === 'DELIVERED' && (
                      <button className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        Leave Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};







