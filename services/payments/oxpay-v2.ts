/**
 * OxPay Payment Gateway Service v2
 * Based on oxpay-payments-api-reference.yaml
 * Focus: Hosted Payment Page (HPP)
 */

import crypto from "crypto";
import { ExternalServiceError } from "@/lib/errors";
import { CURRENCY } from "@/types";

// OxPay API Configuration
const OXPAY_BASE_URL = process.env.OXPAY_BASE_URL || "https://api.oxpayfinancial.com";
const OXPAY_API_KEY = process.env.OXPAY_API_KEY || "";
const OXPAY_SIGN_KEY = process.env.OXPAY_SIGN_KEY || "";
const OXPAY_MERCHANT_ID = process.env.OXPAY_MERCHANT_ID || "";
const OXPAY_TERMINAL_ID = process.env.OXPAY_TERMINAL_ID || "";

/**
 * Validate OxPay configuration
 */
function validateConfig(): void {
  if (!OXPAY_API_KEY) {
    throw new Error("OXPAY_API_KEY environment variable is required");
  }
  if (!OXPAY_SIGN_KEY) {
    throw new Error("OXPAY_SIGN_KEY environment variable is required");
  }
  if (!OXPAY_MERCHANT_ID) {
    throw new Error("OXPAY_MERCHANT_ID environment variable is required");
  }
  if (!OXPAY_TERMINAL_ID) {
    throw new Error("OXPAY_TERMINAL_ID environment variable is required");
  }
}

/**
 * Generate HMAC-SHA256 signature for request
 * Based on OxPay Integrity requirements
 * @param payload - Request body as JSON string
 * @returns Signature string
 */
function generateSignature(payload: string): string {
  console.log("🔐 [OxPay v2] Generating signature...");
  console.log("🔐 [OxPay v2] Payload (masked):", payload.replace(OXPAY_SIGN_KEY, "***MASKED***"));
  
  const signature = crypto
    .createHmac("sha256", OXPAY_SIGN_KEY)
    .update(payload)
    .digest("hex");
  
  console.log("🔐 [OxPay v2] Signature generated:", signature.substring(0, 20) + "...");
  
  return signature;
}

/**
 * Convert amount to minor units (cents)
 * @param amount - Amount in major currency units
 * @returns Amount in minor units
 */
function amountToMinor(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert minor units to amount
 * @param minor - Amount in minor units
 * @returns Amount in major currency units
 */
function minorToAmount(minor: number): number {
  return minor / 100;
}

/**
 * Request/Response Types
 */
export interface HostedPaymentPageRequest {
  merchant_id: string;
  terminal_id: string;
  merchant_reference_id: string;
  description: string;
  success_url: string;
  failure_url: string;
  notification_url: string;
  amount: {
    value: number; // in minor units (cents)
    currency: string; // ISO 4217 Alpha 3
  };
  source: {
    name: string;
    email: string;
    phone: string;
  };
  capture: boolean; // Auto-capture for card transactions
}

export interface HostedPaymentPageResponse {
  headers: {
    status_code: number;
    status_message: string;
    gateway_response_datetime: string;
  };
  body: {
    oxpay_hpp_url: string;
  };
}

export interface OxPayErrorResponse {
  headers: {
    status_code: number;
    status_message: string;
    gateway_response_datetime: string;
  };
  body: {
    status: string;
    status_desc: string;
  };
}

/**
 * Create Hosted Payment Page URL
 * @param params - Payment parameters
 * @returns Hosted Payment Page URL
 * @throws ExternalServiceError if API call fails
 */
export async function createHostedPaymentPage(
  params: {
    merchantReferenceId: string;
    description: string;
    amount: number; // in major currency units
    currency?: string;
    successUrl: string;
    failureUrl: string;
    notificationUrl: string;
    payerName: string;
    payerEmail: string;
    payerPhone: string;
    capture?: boolean;
  }
): Promise<{ hppUrl: string; sessionId?: string }> {
  console.log("🔵 [OxPay v2] createHostedPaymentPage called");
  console.log("📋 [OxPay v2] Input parameters:", {
    merchantReferenceId: params.merchantReferenceId,
    amount: params.amount,
    currency: params.currency || CURRENCY,
    successUrl: params.successUrl,
    failureUrl: params.failureUrl,
    notificationUrl: params.notificationUrl,
    hasMerchantId: !!OXPAY_MERCHANT_ID,
    hasTerminalId: !!OXPAY_TERMINAL_ID,
  });

  validateConfig();

  if (!params.merchantReferenceId || params.merchantReferenceId.trim().length === 0) {
    throw new Error("Merchant reference ID is required");
  }

  if (params.amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  if (!params.payerEmail || !params.payerName || !params.payerPhone) {
    throw new Error("Payer information (name, email, phone) is required");
  }

  // Convert amount to minor units
  const amountMinor = amountToMinor(params.amount);
  console.log("💰 [OxPay v2] Amount conversion:", { amount: params.amount, amountMinor });

  // Build request payload
  const requestPayload: HostedPaymentPageRequest = {
    merchant_id: OXPAY_MERCHANT_ID,
    terminal_id: OXPAY_TERMINAL_ID,
    merchant_reference_id: params.merchantReferenceId,
    description: params.description || `Payment for order ${params.merchantReferenceId}`,
    success_url: params.successUrl,
    failure_url: params.failureUrl,
    notification_url: params.notificationUrl,
    amount: {
      value: amountMinor,
      currency: params.currency || CURRENCY,
    },
    source: {
      name: params.payerName,
      email: params.payerEmail,
      phone: params.payerPhone,
    },
    capture: params.capture ?? true, // Default to auto-capture
  };

  const payloadString = JSON.stringify(requestPayload);
  console.log("📦 [OxPay v2] Request payload:", JSON.stringify(requestPayload, null, 2));

  // Generate signature
  const signature = generateSignature(payloadString);

  // Build request headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${OXPAY_API_KEY}`,
    "Signature": signature,
    "User-Agent": "EcomApp/1.0.0 (compatible; OxPay Integration)",
  };

  console.log("📋 [OxPay v2] Request headers:", {
    "Content-Type": headers["Content-Type"],
    "Authorization": `Bearer ${OXPAY_API_KEY.substring(0, 10)}...`,
    "Signature": signature.substring(0, 20) + "...",
    "User-Agent": headers["User-Agent"],
  });

  const requestUrl = `${OXPAY_BASE_URL}/payment-page`;
  console.log("🌐 [OxPay v2] Making request to:", requestUrl);

  try {
    const response = await fetch(requestUrl, {
      method: "POST",
      headers,
      body: payloadString,
    });

    console.log("📡 [OxPay v2] Response status:", response.status, response.statusText);
    console.log("📡 [OxPay v2] Response headers:", Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log("📡 [OxPay v2] Raw response:", responseText);

    if (!response.ok) {
      let errorBody: OxPayErrorResponse | null = null;
      try {
        errorBody = JSON.parse(responseText) as OxPayErrorResponse;
      } catch {
        // If parsing fails, use raw text
      }

      console.error("❌ [OxPay v2] API error response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody || responseText,
      });

      const errorMessage = errorBody?.body?.status_desc || `API returned ${response.status}: ${responseText}`;
      throw new ExternalServiceError(
        "OxPay",
        errorMessage,
        { status: response.status, statusText: response.statusText, body: errorBody }
      );
    }

    const data = JSON.parse(responseText) as HostedPaymentPageResponse;
    console.log("✅ [OxPay v2] API response received:", JSON.stringify(data, null, 2));

    // Check response status
    if (data.headers.status_code !== 0) {
      console.error("❌ [OxPay v2] Error response code:", {
        statusCode: data.headers.status_code,
        statusMessage: data.headers.status_message,
        fullResponse: data,
      });
      throw new ExternalServiceError(
        "OxPay",
        data.headers.status_message || "Unknown error",
        { statusCode: data.headers.status_code, fullResponse: data }
      );
    }

    const hppUrl = data.body.oxpay_hpp_url;
    console.log("✅ [OxPay v2] Hosted Payment Page URL generated:", {
      hppUrl,
      hasUrl: !!hppUrl,
      urlLength: hppUrl?.length,
    });

    if (!hppUrl) {
      console.error("❌ [OxPay v2] No oxpay_hpp_url in response:", data);
      throw new ExternalServiceError(
        "OxPay",
        "Hosted Payment Page URL not found in response",
        { response: data }
      );
    }

    // Extract session_id from URL if present
    const sessionIdMatch = hppUrl.match(/[?&]session_id=([^&]+)/);
    const sessionId = sessionIdMatch ? sessionIdMatch[1] : undefined;

    console.log("✅ [OxPay v2] Payment page URL created successfully:", {
      hppUrl,
      sessionId,
    });

    return {
      hppUrl,
      sessionId,
    };
  } catch (error: unknown) {
    console.error("❌ [OxPay v2] createHostedPaymentPage error:", error);

    // Re-throw ExternalServiceError as-is
    if (error instanceof ExternalServiceError) {
      throw error;
    }

    // Wrap other errors
    if (error instanceof Error) {
      throw new ExternalServiceError("OxPay", error.message, { originalError: error });
    }

    throw new ExternalServiceError("OxPay", "Unknown error occurred", { error });
  }
}

/**
 * Verify webhook signature from OxPay
 * @param payload - Webhook payload as JSON string
 * @param signature - Signature from OxPay header
 * @returns True if signature is valid
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  console.log("🔐 [OxPay v2] Verifying webhook signature...");
  console.log("🔐 [OxPay v2] Received signature:", signature);

  const calculatedSignature = generateSignature(payload);
  const isValid = calculatedSignature.toLowerCase() === signature.toLowerCase();

  console.log("🔐 [OxPay v2] Calculated signature:", calculatedSignature.substring(0, 20) + "...");
  console.log("🔐 [OxPay v2] Signature match:", isValid);

  return isValid;
}

/**
 * Transaction state mapping
 */
export enum OxPayTransactionState {
  PENDING = "pending",
  SUCCESS = "success",
  FAILED = "failed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

/**
 * Map OxPay transaction state to internal payment status
 */
export function mapTransactionStateToPaymentStatus(
  transactionState: string
): "INITIATED" | "AUTHORIZED" | "CAPTURED" | "FAILED" | "REFUNDED" {
  const state = transactionState.toLowerCase();
  
  if (state === "success" || state === "authorized" || state === "captured") {
    return "CAPTURED";
  }
  if (state === "failed" || state === "cancelled" || state === "voided") {
    return "FAILED";
  }
  if (state === "refunded") {
    return "REFUNDED";
  }
  
  return "INITIATED";
}

/**
 * Map OxPay transaction state to internal order status
 */
export function mapTransactionStateToOrderStatus(
  transactionState: string
): "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED" {
  const state = transactionState.toLowerCase();
  
  if (state === "success" || state === "authorized" || state === "captured") {
    return "PAID";
  }
  if (state === "failed" || state === "cancelled" || state === "voided") {
    return "CANCELLED";
  }
  if (state === "refunded") {
    return "REFUNDED";
  }
  
  return "PENDING";
}

