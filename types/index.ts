/**
 * Shared type definitions for the application
 */

import { Role, PaymentStatus, OrderStatus } from "@prisma/client";

/**
 * User types
 */
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  image: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product types
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  slug: string;
  images: string[];
  categoryId: string | null;
  sellerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number | null;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cart types
 */
export interface CartItem {
  id: string;
  quantity: number;
  product: Product;
  variant: ProductVariant | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartData {
  items: CartItem[];
  total: string;
  itemCount: number;
}

/**
 * Order types
 */
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  price: number;
  product: Product;
  variant: ProductVariant | null;
}

export interface ShippingInfo {
  id: string;
  orderId: string;
  address: string;
  city: string;
  state: string | null;
  postal: string;
  country: string;
}

export interface Payment {
  id: string;
  orderId: string;
  provider: string;
  providerRef: string | null;
  status: PaymentStatus;
  amount: number;
  currency: string;
  rawPayload: unknown | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  userId: string;
  total: number;
  status: OrderStatus;
  items: OrderItem[];
  shipping: ShippingInfo | null;
  payment: Payment | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Category types
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * API Response types
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  code?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Form types
 */
export interface ShippingFormData {
  address: string;
  city: string;
  state?: string;
  postal: string;
  country: string;
}

export interface CheckoutFormData {
  shippingInfo: ShippingFormData;
  voucherCode?: string;
  paymentMethod: string;
}

/**
 * Payment types
 */
export interface PaymentIntent {
  paymentUrl: string;
  referenceNo: string;
}

export interface PaymentStatusResponse {
  status: PaymentStatus;
  orderStatus: OrderStatus;
  payment: Payment;
  order: Order;
}

/**
 * Constants
 */
export const CURRENCY = "SGD" as const;
export const CURRENCY_SYMBOL = "S$" as const;
export const DEFAULT_COUNTRY = "SG" as const;

export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
  maxLimit: 100,
} as const;

