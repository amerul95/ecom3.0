import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/payments/oxpay-v2/return
 * Return callback after payment (UX redirect only)
 * Note: Never update DB here - user may close browser
 * The webhook handles the actual payment status update
 */
export async function GET(request: NextRequest) {
  console.log("🔵 [RETURN v2] GET /api/payments/oxpay-v2/return called");
  console.log("📋 [RETURN v2] Request URL:", request.url);

  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const merchantReferenceId = searchParams.get("merchant_reference_id") || searchParams.get("merchantReferenceId");
    const sessionId = searchParams.get("session_id");
    const oxpayTxnId = searchParams.get("oxpay_txn_id");

    console.log("📦 [RETURN v2] Query parameters:", {
      status,
      merchantReferenceId,
      sessionId,
      oxpayTxnId,
      allParams: Object.fromEntries(searchParams.entries()),
    });

    // Build receipt URL with reference
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get("origin") || "http://localhost:3000";
    const reference = merchantReferenceId || sessionId || oxpayTxnId;

    if (!reference) {
      console.error("❌ [RETURN v2] Missing reference in return URL");
      return NextResponse.redirect(
        new URL("/checkout?error=missing_reference", baseUrl)
      );
    }

    console.log("✅ [RETURN v2] Reference found:", reference);
    console.log("🔄 [RETURN v2] Payment status from OxPay:", status);

    // Redirect to receipt page with reference
    // The receipt page will query the payment status from the database
    const receiptUrl = `/checkout/receipt?ref=${encodeURIComponent(reference)}`;
    console.log("🔄 [RETURN v2] Redirecting to receipt page:", receiptUrl);

    return NextResponse.redirect(new URL(receiptUrl, baseUrl));
  } catch (error: unknown) {
    console.error("❌ [RETURN v2] GET /api/payments/oxpay-v2/return error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get("origin") || "http://localhost:3000";
    return NextResponse.redirect(
      new URL("/checkout?error=payment_return_error", baseUrl)
    );
  }
}

