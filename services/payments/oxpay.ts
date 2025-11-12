import crypto from "crypto";

// OxPay API Configuration
const OXPAY_BASE_URL = process.env.OXPAY_BASE_URL || "https://gw2.mcpayment.net";
const OXPAY_MCPTID = process.env.OXPAY_MCPTID || "";
// userId and password are optional for eCom - removed per specification
// const OXPAY_USER_ID = process.env.OXPAY_USER_ID || "";
// const OXPAY_PASSWORD = process.env.OXPAY_PASSWORD || "";
const OXPAY_PASSWORD_KEY = process.env.OXPAY_PASSWORD_KEY || "";
const OXPAY_STATUS_URL = process.env.OXPAY_STATUS_URL || "";
const OXPAY_RETURN_URL = process.env.OXPAY_RETURN_URL || "";

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
 */
export async function createRedirectPayment(
  referenceNo: string,
  amount: number,
  currency: string = "MYR"
): Promise<{ paymentUrl: string; referenceNo: string }> {
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
      throw new Error(`OxPay API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ [OxPay] API response received:", JSON.stringify(data, null, 2));

    if (data.respCode !== "00" && data.respCode !== "0000") {
      console.error("❌ [OxPay] Error response code:", {
        respCode: data.respCode,
        respMsg: data.respMsg,
        fullResponse: data,
      });
      throw new Error(`OxPay error: ${data.respMsg || "Unknown error"}`);
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
      throw new Error("Payment URL not found in OxPay response");
    }

    return {
      paymentUrl,
      referenceNo: finalReferenceNo,
    };
  } catch (error: any) {
    console.error("❌ [OxPay] createRedirectPayment error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    throw new Error(`Failed to create payment: ${error.message}`);
  }
}

/**
 * Query payment detail by reference number
 * @param referenceNo - Reference number to query
 * @param currency - Currency code
 * @param amountMinor - Amount in minor units
 * @returns Payment details
 */
export async function queryDetailByRef(
  referenceNo: string,
  currency: string = "SGD",
  amountMinor?: number
): Promise<any> {
  // For eCom, userId and password are optional - removed per specification
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
      throw new Error(`OxPay API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("OxPay queryDetailByRef error:", error);
    throw new Error(`Failed to query payment: ${error.message}`);
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

