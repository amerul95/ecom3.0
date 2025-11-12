'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Link from 'next/link';
import Navbar from '../../components/navbar/Navbar';
import Footer from '../../components/footer/Footer';

interface PaymentData {
  id: string;
  status: string;
  amount: string;
  currency: string;
  providerRef: string | null;
  order: {
    id: string;
    status: string;
    total: string;
    createdAt: string;
    items: Array<{
      id: string;
      quantity: number;
      price: string;
      product: {
        id: string;
        name: string;
        images: string[];
      };
      variant: {
        id: string;
        name: string;
      } | null;
    }>;
  };
}

function ReceiptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ref = searchParams.get('ref');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=' + encodeURIComponent('/checkout/receipt'));
      return;
    }

    if (status === 'authenticated' && ref) {
      fetchPaymentStatus();
    }
  }, [status, ref, router]);

  const fetchPaymentStatus = async () => {
    if (!ref) {
      setError('Missing payment reference');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // Find payment by reference number
      const response = await axios.get(`/api/payments/oxpay/status?ref=${encodeURIComponent(ref)}`);
      setPayment(response.data);
    } catch (err: any) {
      console.error('Failed to fetch payment status:', err);
      setError(err.response?.data?.error || 'Failed to load payment status');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: string | number): string => {
    if (typeof price === 'number') {
      return price.toFixed(2);
    }
    return parseFloat(price).toFixed(2);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'CAPTURED':
      case 'PAID':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'FAILED':
      case 'CANCELLED':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'REFUNDED':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'CAPTURED':
        return 'Payment Successful';
      case 'PAID':
        return 'Order Paid';
      case 'FAILED':
        return 'Payment Failed';
      case 'CANCELLED':
        return 'Payment Cancelled';
      case 'REFUNDED':
        return 'Payment Refunded';
      case 'INITIATED':
        return 'Payment Pending';
      default:
        return status;
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading payment status...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect
  }

  if (error || !payment) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center py-12">
              <div className="text-red-600 text-5xl mb-4">✕</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Status Not Found</h2>
              <p className="text-gray-600 mb-6">{error || 'Unable to retrieve payment information'}</p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/orders"
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  View Orders
                </Link>
                <Link
                  href="/"
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const isSuccess = payment.status === 'CAPTURED' || payment.order.status === 'PAID';

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {/* Status Header */}
          <div className="text-center mb-8">
            <div className={`inline-block p-4 rounded-full mb-4 ${isSuccess ? 'bg-green-100' : 'bg-red-100'}`}>
              {isSuccess ? (
                <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-16 h-16 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isSuccess ? 'Payment Successful!' : 'Payment Status'}
            </h1>
            <div className={`inline-block px-4 py-2 rounded-lg border ${getStatusColor(payment.status)}`}>
              <span className="font-semibold">{getStatusText(payment.status)}</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="border-t border-gray-200 pt-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium text-gray-900">{payment.order.id}</span>
              </div>
              {payment.providerRef && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Reference:</span>
                  <span className="font-medium text-gray-900">{payment.providerRef}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-bold text-indigo-600 text-lg">
                  {payment.currency} {formatPrice(payment.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium text-gray-900">{formatDate(payment.order.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="border-t border-gray-200 pt-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-4">
              {payment.order.items.map((item) => {
                const firstImage = item.product.images && item.product.images.length > 0
                  ? item.product.images[0]
                  : null;

                return (
                  <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No Image</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                      {item.variant && (
                        <p className="text-sm text-gray-600">Variant: {item.variant.name}</p>
                      )}
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-lg font-semibold text-indigo-600 mt-1">
                        {payment.currency} {formatPrice(Number(item.price) * item.quantity)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex gap-4 justify-center">
              <Link
                href="/orders"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                View All Orders
              </Link>
              <Link
                href="/"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
        <Footer />
      </>
    }>
      <ReceiptContent />
    </Suspense>
  );
}





