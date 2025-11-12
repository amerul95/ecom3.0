import { NextRequest, NextResponse } from "next/server";

// GET /api/payments/oxpay/return - Return callback after payment (UX only)
// This redirects the user to the receipt page
// Note: Never update DB here - user may close browser
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const referenceNo = searchParams.get("referenceNo") || searchParams.get("reference_no");
    const state = searchParams.get("state") || searchParams.get("status");

    if (!referenceNo) {
      // Redirect to checkout with error
      return NextResponse.redirect(
        new URL("/checkout?error=missing_reference", request.url)
      );
    }

    // Redirect to receipt page with reference number
    // The receipt page will query the payment status from the database
    return NextResponse.redirect(
      new URL(`/checkout/receipt?ref=${encodeURIComponent(referenceNo)}`, request.url)
    );
  } catch (error: any) {
    console.error("GET /api/payments/oxpay/return error:", error);
    return NextResponse.redirect(
      new URL("/checkout?error=payment_return_error", request.url)
    );
  }
}

