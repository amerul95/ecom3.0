/**
 * ToyyibPay Payment Handler (Sandbox)
 * Uses dev.toyyibpay.com for sandbox mode
 * Location: Payment/handler/ToyyibpayHandler.ts
 */

import crypto from "crypto";
import { ExternalServiceError } from "@/lib/errors";

// Sandbox: https://dev.toyyibpay.com
const TOYYIBPAY_BASE_URL =
  process.env.TOYYIBPAY_BASE_URL || "https://dev.toyyibpay.com";
const TOYYIBPAY_USER_SECRET_KEY = process.env.TOYYIBPAY_USER_SECRET_KEY || "";

function validateConfig(): void {
  if (!TOYYIBPAY_USER_SECRET_KEY) {
    throw new Error("TOYYIBPAY_USER_SECRET_KEY environment variable is required");
  }
}

/** Convert amount to cents (ToyyibPay uses cents: 100 = RM1) */
function amountToCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Create or get category for bills.
 * ToyyibPay requires bills to belong to a category.
 */
export async function getOrCreateCategory(): Promise<string> {
  validateConfig();

  const categoryCode = process.env.TOYYIBPAY_CATEGORY_CODE;
  if (categoryCode?.trim()) {
    return categoryCode;
  }

  const params = new URLSearchParams({
    userSecretKey: TOYYIBPAY_USER_SECRET_KEY,
    catname: "Ecommerce Orders",
    catdescription: "Ecommerce order payments",
  });

  const response = await fetch(`${TOYYIBPAY_BASE_URL}/index.php/api/createCategory`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ExternalServiceError(
      "ToyyibPay",
      `Failed to create category: ${response.status} ${text}`,
      { status: response.status }
    );
  }

  const data = await response.json();
  const code = Array.isArray(data) ? data[0]?.CategoryCode : data?.CategoryCode;
  if (!code) {
    throw new ExternalServiceError("ToyyibPay", "No CategoryCode in response", {
      response: data,
    });
  }
  return code;
}

export interface CreateBillParams {
  orderId: string;
  description: string;
  amount: number;
  returnUrl: string;
  callbackUrl: string;
  payerName?: string;
  payerEmail?: string;
  payerPhone?: string;
}

export interface CreateBillResult {
  billCode: string;
  paymentUrl: string;
}

/**
 * Create a bill and get payment URL
 */
export async function createBill(params: CreateBillParams): Promise<CreateBillResult> {
  validateConfig();
  if (!params.orderId?.trim()) throw new Error("Order ID is required");
  if (params.amount <= 0) throw new Error("Amount must be greater than 0");

  const categoryCode = await getOrCreateCategory();
  const amountCents = amountToCents(params.amount);

  const billParams: Record<string, string> = {
    userSecretKey: TOYYIBPAY_USER_SECRET_KEY,
    categoryCode,
    billName: (params.description || `Order ${params.orderId}`).substring(0, 30).replace(/[^a-zA-Z0-9 _]/g, "_"),
    billDescription: (params.description || `Order ${params.orderId}`).substring(0, 100).replace(/[^a-zA-Z0-9 _]/g, "_"),
    billPriceSetting: "1",
    billPayorInfo: "1",
    billAmount: String(amountCents),
    billReturnUrl: params.returnUrl,
    billCallbackUrl: params.callbackUrl,
    billExternalReferenceNo: params.orderId,
    billTo: params.payerName || "Customer",
    billEmail: params.payerEmail || "customer@example.com",
    billPhone: params.payerPhone || "0000000000",
    billPaymentChannel: "2", // 0=FPX only, 1=Card only, 2=both
  };

  const body = new URLSearchParams(billParams).toString();

  const response = await fetch(`${TOYYIBPAY_BASE_URL}/index.php/api/createBill`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ExternalServiceError(
      "ToyyibPay",
      `Failed to create bill: ${response.status} ${text}`,
      { status: response.status }
    );
  }

  const data = await response.json();
  const billCode = Array.isArray(data) ? data[0]?.BillCode : data?.BillCode;
  if (!billCode) {
    throw new ExternalServiceError("ToyyibPay", "No BillCode in response", {
      response: data,
    });
  }

  const paymentUrl = `${TOYYIBPAY_BASE_URL}/${billCode}`;
  return { billCode, paymentUrl };
}

/**
 * Verify callback hash from ToyyibPay
 * Hash formula: MD5(userSecretKey + status + order_id + refno + "ok")
 */
export function verifyCallbackHash(
  status: string,
  orderId: string,
  refno: string,
  receivedHash: string
): boolean {
  const expectedHash = crypto
    .createHash("md5")
    .update(TOYYIBPAY_USER_SECRET_KEY + status + orderId + refno + "ok")
    .digest("hex");
  return expectedHash === receivedHash;
}

/**
 * Map ToyyibPay status to payment status
 * status: 1=success, 2=pending, 3=fail
 */
export function mapToyyibpayStatusToPaymentStatus(
  status: string
): "INITIATED" | "AUTHORIZED" | "CAPTURED" | "FAILED" | "REFUNDED" {
  if (status === "1") return "CAPTURED";
  if (status === "3") return "FAILED";
  return "INITIATED";
}

/**
 * Map ToyyibPay status to order status
 */
export function mapToyyibpayStatusToOrderStatus(
  status: string
): "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED" {
  if (status === "1") return "PAID";
  if (status === "3") return "CANCELLED";
  return "PENDING";
}
