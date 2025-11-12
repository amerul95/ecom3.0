import crypto from "crypto";
import { ExternalServiceError } from "@/lib/errors";
import { CURRENCY } from "@/types";

/**
 * OxPay Payment Gateway Service
 * Handles payment processing, queries, refunds, and webhook verification
 */

// OxPay API Configuration
const OXPAY_BASE_URL = process.env.OXPAY_BASE_URL || "https://gw2.mcpayment.net";
const OXPAY_MCPTID = process.env.OXPAY_MCPTID || "";
const OXPAY_PASSWORD_KEY = process.env.OXPAY_PASSWORD_KEY || "";
const OXPAY_STATUS_URL = process.env.OXPAY_STATUS_URL || "";
const OXPAY_RETURN_URL = process.env.OXPAY_RETURN_URL || "";

/**
 * Validate OxPay configuration
 */
function validateConfig(): void {
  if (!OXPAY_MCPTID) {
    throw new Error("OXPAY_MCPTID environment variable is required");
  }
  if (!OXPAY_PASSWORD_KEY) {
    throw new Error("OXPAY_PASSWORD_KEY environment variable is required");
  }
  if (!OXPAY_STATUS_URL) {
    throw new Error("OXPAY_STATUS_URL environment variable is required");
  }
  if (!OXPAY_RETURN_URL) {
    throw new Error("OXPAY_RETURN_URL environment variable is required");
  }
}

// Payment states from OxPay
export enum OxPayState {
  INITIATED = "1",
  AUTHORIZED = "2",
  FAILED = "3",
  CANCELLED = "4",
  REFUNDED = "5",
  VOIDED = "6",
}

// Generate HMAC-SHA512 signature
function generateSignature(params: Record<string, string | number>): string {
  // Exclude signature field from signature generation
  const paramsWithoutSignature = { ...params };
  delete paramsWithoutSignature.signature;
  
  // Sort parameters by key
  const sortedKeys = Object.keys(paramsWithoutSignature).sort();
  const queryString = sortedKeys
    .map((key) => `${key}=${paramsWithoutSignature[key]}`)
    .join("&");

  // Add password key
  const stringToSign = `${queryString}&key=${OXPAY_PASSWORD_KEY}`;

  // Generate HMAC-SHA512
  const signature = crypto
    .createHmac("sha512", OXPAY_PASSWORD_KEY)
    .update(stringToSign)
    .digest("hex")
    .toUpperCase();

  return signature;
}

// Convert amount to minor units (cents/sen)
function amountToMinor(amount: number): number {
  return Math.round(amount * 100);
}

// Convert minor units to amount
function minorToAmount(minor: number): number {
  return minor / 100;
}

/**
 * Create redirect payment URL for hosted checkout
 * @param referenceNo - Unique reference number for the payment
 * @param amount - Amount in major currency units (e.g., 100.50 for S$ 100.50)
 * @param currency - Currency code (default: SGD)
 * @returns Payment URL for redirect
 * @throws ExternalServiceError if OxPay API call fails
 */
export async function createRedirectPayment(
  referenceNo: string,
  amount: number,
  currency: string = CURRENCY
): Promise<{ paymentUrl: string; referenceNo: string }> {
  validateConfig();
  
  if (!referenceNo || referenceNo.trim().length === 0) {
    throw new Error("Reference number is required");
  }
  
  if (amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }
  console.log("🔵 [OxPay] createRedirectPayment called");
  console.log("📋 [OxPay] Input parameters:", {
    referenceNo,
    amount,
    currency,
    baseUrl: OXPAY_BASE_URL,
    hasMcptid: !!OXPAY_MCPTID,
    hasPasswordKey: !!OXPAY_PASSWORD_KEY,
    statusUrl: OXPAY_STATUS_URL,
    returnUrl: OXPAY_RETURN_URL,
  });

  const amountMinor = amountToMinor(amount);
  console.log("💰 [OxPay] Amount conversion:", { amount, amountMinor });

  // For eCom, userId and password are optional - removed per specification
  // timeStamp, serialNo, fcmTokenId, ipAddress are mPOS-only or optional - removed
  const params: Record<string, string | number> = {
    mcptid: OXPAY_MCPTID,
    referenceNo,
    amount: amountMinor,
    currency,
    statusUrl: OXPAY_STATUS_URL,
    returnUrl: OXPAY_RETURN_URL,
  };

  // Generate signature
  const signature = generateSignature(params);
  params.signature = signature;
  
  console.log("🔐 [OxPay] Request params:", {
    mcptid: OXPAY_MCPTID,
    referenceNo,
    amount: amountMinor,
    currency,
    statusUrl: OXPAY_STATUS_URL,
    returnUrl: OXPAY_RETURN_URL,
    signature: signature.substring(0, 20) + "...",
  });

  const requestUrl = `${OXPAY_BASE_URL}/api/v6/payment`;
  console.log("🌐 [OxPay] Making request to:", requestUrl);

  try {
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    console.log("📡 [OxPay] Response status:", response.status, response.statusText);
    console.log("📡 [OxPay] Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [OxPay] API error response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new ExternalServiceError(
        "OxPay",
        `API returned ${response.status}: ${errorText}`,
        { status: response.status, statusText: response.statusText }
      );
    }

    const data = await response.json();
    console.log("✅ [OxPay] API response received:", JSON.stringify(data, null, 2));

    if (data.respCode !== "00" && data.respCode !== "0000") {
      console.error("❌ [OxPay] Error response code:", {
        respCode: data.respCode,
        respMsg: data.respMsg,
        fullResponse: data,
      });
      throw new ExternalServiceError(
        "OxPay",
        data.respMsg || "Unknown error",
        { respCode: data.respCode, fullResponse: data }
      );
    }

    const paymentUrl = data.paymentUrl || data.redirectUrl;
    const finalReferenceNo = data.referenceNo || referenceNo;

    console.log("✅ [OxPay] Payment URL generated:", {
      paymentUrl,
      referenceNo: finalReferenceNo,
      hasPaymentUrl: !!paymentUrl,
    });

    if (!paymentUrl) {
      console.error("❌ [OxPay] No paymentUrl in response:", data);
      throw new ExternalServiceError(
        "OxPay",
        "Payment URL not found in response",
        { response: data }
      );
    }

    return {
      paymentUrl,
      referenceNo: finalReferenceNo,
    };
  } catch (error: unknown) {
    console.error("❌ [OxPay] createRedirectPayment error:", error);
    
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
 * Query payment detail by reference number
 * @param referenceNo - Reference number to query
 * @param currency - Currency code
 * @param amountMinor - Amount in minor units
 * @returns Payment details
 */
/**
 * Query payment detail by reference number
 * @param referenceNo - Reference number to query
 * @param currency - Currency code (default: SGD)
 * @param amountMinor - Amount in minor units (optional)
 * @returns Payment details from OxPay
 * @throws ExternalServiceError if query fails
 */
export async function queryDetailByRef(
  referenceNo: string,
  currency: string = CURRENCY,
  amountMinor?: number
): Promise<unknown> {
  validateConfig();
  
  if (!referenceNo || referenceNo.trim().length === 0) {
    throw new Error("Reference number is required");
  }
  
  const params: Record<string, string | number> = {
    mcptid: OXPAY_MCPTID,
    referenceNo,
    currency,
  };

  if (amountMinor !== undefined) {
    params.amount = amountMinor;
  }

  const signature = generateSignature(params);
  params.signature = signature;

  try {
    const response = await fetch(`${OXPAY_BASE_URL}/api/v5/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ExternalServiceError(
        "OxPay",
        `Query API returned ${response.status}: ${errorText}`,
        { status: response.status }
      );
    }

    const data = await response.json();
    return data;
  } catch (error: unknown) {
    console.error("OxPay queryDetailByRef error:", error);
    
    if (error instanceof ExternalServiceError) {
      throw error;
    }
    
    if (error instanceof Error) {
      throw new ExternalServiceError("OxPay", `Failed to query payment: ${error.message}`, { originalError: error });
    }
    
    throw new ExternalServiceError("OxPay", "Unknown error occurred while querying payment", { error });
  }
}

/**
 * Void a pending transaction
 * @param referenceNo - Reference number of the transaction
 * @param currency - Currency code
 * @param amountMinor - Amount in minor units
 * @returns Void result
 */
export async function voidTransaction(
  referenceNo: string,
  currency: string = "SGD",
  amountMinor: number
): Promise<any> {
  // For eCom, userId and password are optional - removed per specification
  const params: Record<string, string | number> = {
    mcptid: OXPAY_MCPTID,
    referenceNo,
    currency,
    amount: amountMinor,
  };

  const signature = generateSignature(params);
  params.signature = signature;

  try {
    const response = await fetch(`${OXPAY_BASE_URL}/api/v5/void`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OxPay API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("OxPay voidTransaction error:", error);
    throw new Error(`Failed to void transaction: ${error.message}`);
  }
}

/**
 * Refund a completed transaction
 * @param referenceNo - Reference number of the transaction
 * @param currency - Currency code
 * @param amountMinor - Amount in minor units to refund
 * @returns Refund result
 */
export async function refundTransaction(
  referenceNo: string,
  currency: string = "SGD",
  amountMinor: number
): Promise<any> {
  // For eCom, userId and password are optional - removed per specification
  const params: Record<string, string | number> = {
    mcptid: OXPAY_MCPTID,
    referenceNo,
    currency,
    amount: amountMinor,
  };

  const signature = generateSignature(params);
  params.signature = signature;

  try {
    const response = await fetch(`${OXPAY_BASE_URL}/api/v5/refund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OxPay API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("OxPay refundTransaction error:", error);
    throw new Error(`Failed to refund transaction: ${error.message}`);
  }
}

/**
 * Capture a pre-authorized payment
 * @param referenceNo - Reference number of the transaction
 * @param currency - Currency code
 * @param amountMinor - Amount in minor units to capture
 * @returns Capture result
 */
export async function captureTransaction(
  referenceNo: string,
  currency: string = "SGD",
  amountMinor: number
): Promise<any> {
  // For eCom, userId and password are optional - removed per specification
  const params: Record<string, string | number> = {
    mcptid: OXPAY_MCPTID,
    referenceNo,
    currency,
    amount: amountMinor,
  };

  const signature = generateSignature(params);
  params.signature = signature;

  try {
    const response = await fetch(`${OXPAY_BASE_URL}/api/v5/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OxPay API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("OxPay captureTransaction error:", error);
    throw new Error(`Failed to capture transaction: ${error.message}`);
  }
}

/**
 * Verify webhook signature from OxPay
 * @param payload - Webhook payload
 * @param signature - Signature from OxPay
 * @returns True if signature is valid
 */
export function verifyWebhookSignature(
  payload: Record<string, any>,
  signature: string
): boolean {
  const calculatedSignature = generateSignature(payload);
  return calculatedSignature === signature.toUpperCase();
}

