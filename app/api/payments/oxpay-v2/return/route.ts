import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/payments/oxpay-v2/return
 * Return callback after payment (UX redirect only)
 * Note: Never update DB here - user may close browser
 * The webhook handles the actual payment status update
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const merchantReferenceId = searchParams.get("merchant_reference_id") || searchParams.get("merchantReferenceId");
    const sessionId = searchParams.get("session_id");
    const oxpayTxnId = searchParams.get("oxpay_txn_id");

    // Build receipt URL with reference
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get("origin") || "http://localhost:3000";
    const reference = merchantReferenceId || sessionId || oxpayTxnId;

    if (!reference) {
      return NextResponse.redirect(
        new URL("/checkout?error=missing_reference&message=Payment+reference+missing", baseUrl)
      );
    }

    const params = new URLSearchParams({ ref: reference });
    if (status && (status.toLowerCase() === "failed" || status.toLowerCase() === "cancelled" || status.toLowerCase() === "canceled")) {
      params.set("status", status.toLowerCase() === "canceled" ? "cancelled" : status.toLowerCase());
    }
    const receiptUrl = `/checkout/receipt?${params.toString()}`;
    return NextResponse.redirect(new URL(receiptUrl, baseUrl));
  } catch (error: unknown) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get("origin") || "http://localhost:3000";
    return NextResponse.redirect(
      new URL("/checkout?error=payment_return_error", baseUrl)
    );
  }
}

