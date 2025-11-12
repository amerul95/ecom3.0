'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Link from 'next/link';

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number | string;
    images: string[];
  };
  variant: {
    id: string;
    name: string;
    price: number | string | null;
  } | null;
}

interface CartData {
  items: CartItem[];
  total: string;
  itemCount: number;
}

// Helper function to format price
function formatPrice(price: number | string | null): string {
  if (price === null || price === undefined) return '0.00';
  if (typeof price === 'number') {
    return price.toFixed(2);
  }
  if (typeof price === 'string') {
    return parseFloat(price).toFixed(2);
  }
  return '0.00';
}

export const Checkout: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [cart, setCart] = useState<CartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Shipping form state
  const [shippingInfo, setShippingInfo] = useState({
    address: '',
    city: '',
    state: '',
    postal: '',
    country: 'SG',
  });

  // Voucher state
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);

  // Payment method state (OxPay as default)
  const [paymentMethod, setPaymentMethod] = useState<string>('oxpay');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=' + encodeURIComponent('/checkout'));
    }
  }, [status, router]);

  // Fetch cart items
  useEffect(() => {
    const fetchCart = async () => {
      if (status !== 'authenticated') return;

      try {
        setIsLoading(true);
        const response = await axios.get('/api/cart');
        setCart(response.data);
      } catch (err: any) {
        console.error('Failed to fetch cart:', err);
        if (err.response?.status === 401) {
          router.push('/login?redirect=' + encodeURIComponent('/checkout'));
        } else {
          setError('Failed to load cart items');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCart();
  }, [status, router]);

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError('Please enter a voucher code');
      return;
    }

    try {
      setIsApplyingVoucher(true);
      setVoucherError(null);
      
      // TODO: Call voucher API to validate and get discount
      // const response = await axios.post('/api/vouchers/validate', { code: voucherCode });
      // For now, simulate a discount
      const mockDiscount = 10; // 10% discount
      setVoucherDiscount(mockDiscount);
      setVoucherApplied(true);
    } catch (err: any) {
      console.error('Failed to apply voucher:', err);
      setVoucherError(err.response?.data?.error || 'Invalid voucher code');
      setVoucherApplied(false);
      setVoucherDiscount(0);
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setVoucherCode('');
    setVoucherApplied(false);
    setVoucherDiscount(0);
    setVoucherError(null);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cart || cart.items.length === 0) {
      setError('Cart is empty');
      return;
    }

    // Validate shipping info
    if (!shippingInfo.address || !shippingInfo.city || !shippingInfo.postal) {
      setError('Please fill in all required shipping fields');
      return;
    }

    // Validate payment method
    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }

    // Only OxPay is enabled for now
    if (paymentMethod !== 'oxpay') {
      setError('Only OxPay payment is currently available. Please select OxPay to proceed.');
      return;
    }

    try {
      console.log('🔵 [Checkout] handlePlaceOrder called');
      console.log('📋 [Checkout] Order details:', {
        cartItems: cart?.items.length,
        total: total,
        paymentMethod,
        shippingInfo,
      });

      setIsPlacingOrder(true);
      setError(null);

      // Step 1: Create order
      console.log('🔄 [Checkout] Creating order...');
      const orderResponse = await axios.post('/api/orders', {
        shippingInfo: {
          address: shippingInfo.address,
          city: shippingInfo.city,
          state: shippingInfo.state || undefined,
          postal: shippingInfo.postal,
          country: shippingInfo.country,
        },
        voucherCode: voucherApplied ? voucherCode : undefined,
        paymentMethod: paymentMethod,
      });

      console.log('✅ [Checkout] Order created:', {
        status: orderResponse.status,
        orderId: orderResponse.data?.id,
        orderData: orderResponse.data,
      });

      if (orderResponse.status !== 201) {
        console.error('❌ [Checkout] Order creation failed:', orderResponse.status);
        throw new Error('Failed to create order');
      }

      const orderId = orderResponse.data.id;
      console.log('✅ [Checkout] Order ID:', orderId);

      // Step 2: Handle payment - Only OxPay is enabled
      if (paymentMethod === 'oxpay') {
        // Redirect to OxPay payment gateway
        try {
          console.log('🔵 [Checkout] Creating payment intent for order:', orderId);
          
          const paymentResponse = await axios.post('/api/payments/oxpay/intent', {
            orderId: orderId,
          });

          console.log('✅ [Checkout] Payment intent response received:', {
            status: paymentResponse.status,
            data: paymentResponse.data,
            hasPaymentUrl: !!paymentResponse.data?.paymentUrl,
            paymentUrl: paymentResponse.data?.paymentUrl,
            referenceNo: paymentResponse.data?.referenceNo,
          });

          if (paymentResponse.data.paymentUrl) {
            console.log('🔄 [Checkout] Redirecting to OxPay gateway:', paymentResponse.data.paymentUrl);
            // Redirect to OxPay payment gateway
            window.location.href = paymentResponse.data.paymentUrl;
            return; // Don't set loading to false, as we're redirecting
          } else {
            console.error('❌ [Checkout] No paymentUrl in response:', paymentResponse.data);
            throw new Error('Payment URL not received from server');
          }
        } catch (paymentErr: any) {
          console.error('❌ [Checkout] Failed to create payment intent:', {
            error: paymentErr,
            message: paymentErr.message,
            response: paymentErr.response,
            responseData: paymentErr.response?.data,
            responseStatus: paymentErr.response?.status,
            stack: paymentErr.stack,
          });
          
          const errorMessage = paymentErr.response?.data?.error 
            || paymentErr.message 
            || 'Failed to initiate payment. Please try again.';
          
          console.error('❌ [Checkout] Error message to display:', errorMessage);
          setError(errorMessage);
          setIsPlacingOrder(false);
          return;
        }
      } else {
        // This should not happen as we validate above, but just in case
        console.warn('⚠️ [Checkout] Invalid payment method selected:', paymentMethod);
        setError('Only OxPay payment is currently available.');
        setIsPlacingOrder(false);
        return;
      }
    } catch (err: any) {
      console.error('Failed to place order:', err);
      setError(err.response?.data?.error || 'Failed to place order. Please try again.');
      setIsPlacingOrder(false);
    }
  };

  // Calculate totals
  const subtotal = cart ? parseFloat(cart.total) : 0;
  const shipping = 0; // Free shipping
  const discount = voucherApplied ? (subtotal * voucherDiscount / 100) : 0;
  const total = subtotal + shipping - discount;

  if (status === 'loading' || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add items to your cart before checkout</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Forms and Products */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Address</h2>
            <form className="space-y-4">
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  id="address"
                  required
                  value={shippingInfo.address}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    required
                    value={shippingInfo.city}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label htmlFor="postal" className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    id="postal"
                    required
                    value={shippingInfo.postal}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, postal: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Postal code"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    id="state"
                    value={shippingInfo.state}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="State (optional)"
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <select
                    id="country"
                    value={shippingInfo.country}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, country: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="MY">Malaysia</option>
                    <option value="SG">Singapore</option>
                    <option value="ID">Indonesia</option>
                    <option value="TH">Thailand</option>
                  </select>
                </div>
              </div>
            </form>
          </div>

          {/* Products to Pay */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Products to Pay</h2>
            <div className="space-y-4">
              {cart.items.map((item) => {
                const price = item.variant?.price
                  ? Number(item.variant.price)
                  : Number(item.product.price);
                const itemTotal = price * item.quantity;
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
                        S$ {formatPrice(itemTotal)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Voucher Code */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Voucher Code</h2>
            <div className="space-y-3">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  placeholder="Enter voucher code"
                  disabled={voucherApplied || isApplyingVoucher}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {!voucherApplied ? (
                  <button
                    type="button"
                    onClick={handleApplyVoucher}
                    disabled={isApplyingVoucher || !voucherCode.trim()}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    {isApplyingVoucher ? 'Applying...' : 'Apply'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRemoveVoucher}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              {voucherError && (
                <p className="text-sm text-red-600">{voucherError}</p>
              )}
              {voucherApplied && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ Voucher applied! {voucherDiscount}% discount
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
            <div className="space-y-3">
              {/* OxPay Option */}
              <label
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  paymentMethod === 'oxpay'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="oxpay"
                  checked={paymentMethod === 'oxpay'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-lg mr-4 shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 text-lg">OxPay</span>
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-1 rounded">Secure</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Secure payment gateway - Credit/Debit Cards, E-Wallets, and Bank Transfer</p>
                  <p className="text-xs text-green-600 mt-2 font-medium">✓ Payment gateway active</p>
                </div>
                {paymentMethod === 'oxpay' && (
                  <div className="ml-4 shrink-0">
                    <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </label>

              {/* Cash on Delivery Option - Disabled */}
              <div
                className="flex items-center p-4 border-2 border-gray-200 rounded-lg bg-gray-50 opacity-60 cursor-not-allowed"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-gray-400 rounded-lg mr-4 shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-500 text-lg">Cash on Delivery</span>
                    <span className="text-xs font-semibold text-gray-400 bg-gray-200 px-2 py-1 rounded">Coming Soon</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Pay with cash when your order is delivered</p>
                </div>
              </div>

              {/* Bank Transfer Option - Disabled */}
              <div
                className="flex items-center p-4 border-2 border-gray-200 rounded-lg bg-gray-50 opacity-60 cursor-not-allowed"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-gray-400 rounded-lg mr-4 shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-500 text-lg">Bank Transfer</span>
                    <span className="text-xs font-semibold text-gray-400 bg-gray-200 px-2 py-1 rounded">Coming Soon</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Transfer funds directly to our bank account. Order will be processed after payment confirmation.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Order Summary & Place Order */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({cart.itemCount} items)</span>
                <span>S$ {formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              {voucherApplied && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({voucherDiscount}%)</span>
                  <span>- S$ {formatPrice(discount)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span className="text-indigo-600">S$ {formatPrice(total)}</span>
              </div>
            </div>

            <form onSubmit={handlePlaceOrder}>
              <button
                type="submit"
                disabled={isPlacingOrder}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {isPlacingOrder ? 'Processing...' : `Place Order - S$ ${formatPrice(total)}`}
              </button>
            </form>

            <Link
              href="/carts"
              className="block mt-4 text-center text-sm text-indigo-600 hover:text-indigo-700"
            >
              ← Back to Cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

