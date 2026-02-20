/**
 * OxPay Payment Handler (Hosted Payment Page)
 * Location: Payment/handler/OxpayHandler.ts
 */

import crypto from "crypto";
import { ExternalServiceError } from "@/lib/errors";
import { CURRENCY } from "@/types";

const OXPAY_BASE_URL = process.env.OXPAY_BASE_URL || "https://api.oxpayfinancial.com";
const OXPAY_API_KEY = process.env.OXPAY_API_KEY || "";
const OXPAY_SIGN_KEY = process.env.OXPAY_SIGN_KEY || "";
const OXPAY_MERCHANT_ID = process.env.OXPAY_MERCHANT_ID || "";
const OXPAY_TERMINAL_ID = process.env.OXPAY_TERMINAL_ID || "";

function validateConfig(): void {
  if (!OXPAY_API_KEY) throw new Error("OXPAY_API_KEY environment variable is required");
  if (!OXPAY_SIGN_KEY) throw new Error("OXPAY_SIGN_KEY environment variable is required");
  if (!OXPAY_MERCHANT_ID) throw new Error("OXPAY_MERCHANT_ID environment variable is required");
  if (!OXPAY_TERMINAL_ID) throw new Error("OXPAY_TERMINAL_ID environment variable is required");
}

function generateSignature(payload: string): string {
  return crypto.createHmac("sha256", OXPAY_SIGN_KEY).update(payload).digest("hex");
}

function amountToMinor(amount: number): number {
  return Math.round(amount * 100);
}

export interface HostedPaymentPageRequest {
  merchant_id: string;
  terminal_id: string;
  merchant_reference_id: string;
  description: string;
  success_url: string;
  failure_url: string;
  notification_url: string;
  amount: { value: number; currency: string };
  source: { name: string; email: string; phone: string };
  capture: boolean;
}

export interface HostedPaymentPageResponse {
  headers: { status_code: number; status_message: string; gateway_response_datetime: string };
  body: { oxpay_hpp_url: string };
}

export interface OxPayErrorResponse {
  headers: { status_code: number; status_message: string; gateway_response_datetime: string };
  body: { status: string; status_desc: string };
}

export async function createHostedPaymentPage(params: {
  merchantReferenceId: string;
  description: string;
  amount: number;
  currency?: string;
  successUrl: string;
  failureUrl: string;
  notificationUrl: string;
  payerName: string;
  payerEmail: string;
  payerPhone: string;
  capture?: boolean;
}): Promise<{ hppUrl: string; sessionId?: string }> {
  validateConfig();
  if (!params.merchantReferenceId?.trim()) throw new Error("Merchant reference ID is required");
  if (params.amount <= 0) throw new Error("Amount must be greater than 0");
  if (!params.payerEmail || !params.payerName || !params.payerPhone) {
    throw new Error("Payer information (name, email, phone) is required");
  }

  const amountMinor = amountToMinor(params.amount);
  const requestPayload: HostedPaymentPageRequest = {
    merchant_id: OXPAY_MERCHANT_ID,
    terminal_id: OXPAY_TERMINAL_ID,
    merchant_reference_id: params.merchantReferenceId,
    description: params.description || `Payment for order ${params.merchantReferenceId}`,
    success_url: params.successUrl,
    failure_url: params.failureUrl,
    notification_url: params.notificationUrl,
    amount: { value: amountMinor, currency: params.currency || CURRENCY },
    source: { name: params.payerName, email: params.payerEmail, phone: params.payerPhone },
    capture: params.capture ?? true,
  };

  const payloadString = JSON.stringify(requestPayload);
  const signature = generateSignature(payloadString);

  const response = await fetch(`${OXPAY_BASE_URL}/payment-page`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OXPAY_API_KEY}`,
      Signature: signature,
      "User-Agent": "EcomApp/1.0.0 (compatible; OxPay Integration)",
    },
    body: payloadString,
  });

  const responseText = await response.text();

  if (!response.ok) {
    let errorBody: OxPayErrorResponse | null = null;
    try {
      errorBody = JSON.parse(responseText) as OxPayErrorResponse;
    } catch {
      /* ignore */
    }
    const errorMessage =
      errorBody?.body?.status_desc || `API returned ${response.status}: ${responseText}`;
    throw new ExternalServiceError("OxPay", errorMessage, {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });
  }

  const data = JSON.parse(responseText) as HostedPaymentPageResponse;
  if (data.headers.status_code !== 0) {
    throw new ExternalServiceError(
      "OxPay",
      data.headers.status_message || "Unknown error",
      { statusCode: data.headers.status_code, fullResponse: data }
    );
  }

  const hppUrl = data.body.oxpay_hpp_url;
  if (!hppUrl) {
    throw new ExternalServiceError("OxPay", "Hosted Payment Page URL not found in response", {
      response: data,
    });
  }

  const sessionIdMatch = hppUrl.match(/[?&]session_id=([^&]+)/);
  const sessionId = sessionIdMatch ? sessionIdMatch[1] : undefined;

  return { hppUrl, sessionId };
}

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const calculatedSignature = generateSignature(payload);
  return calculatedSignature.toLowerCase() === signature.toLowerCase();
}

export enum OxPayTransactionState {
  PENDING = "pending",
  SUCCESS = "success",
  FAILED = "failed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

export function mapTransactionStateToPaymentStatus(
  transactionState: string
): "INITIATED" | "AUTHORIZED" | "CAPTURED" | "FAILED" | "REFUNDED" {
  const state = transactionState.toLowerCase();
  if (state === "success" || state === "authorized" || state === "captured") return "CAPTURED";
  if (state === "failed" || state === "cancelled" || state === "voided") return "FAILED";
  if (state === "refunded") return "REFUNDED";
  return "INITIATED";
}

export function mapTransactionStateToOrderStatus(
  transactionState: string
): "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED" {
  const state = transactionState.toLowerCase();
  if (state === "success" || state === "authorized" || state === "captured") return "PAID";
  if (state === "failed" || state === "cancelled" || state === "voided") return "CANCELLED";
  if (state === "refunded") return "REFUNDED";
  return "PENDING";
}
