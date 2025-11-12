import { NextRequest, NextResponse } from "next/server";

// GET /api/payments/oxpay/return - Return callback after payment (UX only)
// This redirects the user to the receipt page
// Note: Never update DB here - user may close browser
export async function GET(request: NextRequest) {
  console.log("🔵 [RETURN] GET /api/payments/oxpay/return called");
  console.log("📋 [RETURN] Request URL:", request.url);
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const referenceNo = searchParams.get("referenceNo") || searchParams.get("reference_no");
    const state = searchParams.get("state") || searchParams.get("status");
    const respCode = searchParams.get("respCode") || searchParams.get("resp_code");
    const respMsg = searchParams.get("respMsg") || searchParams.get("resp_msg");

    console.log("📦 [RETURN] Query parameters:", {
      referenceNo,
      state,
      respCode,
      respMsg,
      allParams: Object.fromEntries(searchParams.entries()),
    });

    if (!referenceNo) {
      console.error("❌ [RETURN] Missing reference number in return URL");
      // Redirect to checkout with error
      return NextResponse.redirect(
        new URL("/checkout?error=missing_reference", request.url)
      );
    }

    console.log("✅ [RETURN] Reference number found:", referenceNo);
    console.log("🔄 [RETURN] Payment state from OxPay:", state);
    console.log("🔄 [RETURN] Response code:", respCode, "Message:", respMsg);

    // Redirect to receipt page with reference number
    // The receipt page will query the payment status from the database
    const receiptUrl = `/checkout/receipt?ref=${encodeURIComponent(referenceNo)}`;
    console.log("🔄 [RETURN] Redirecting to receipt page:", receiptUrl);
    
    return NextResponse.redirect(
      new URL(receiptUrl, request.url)
    );
  } catch (error: unknown) {
    console.error("❌ [RETURN] GET /api/payments/oxpay/return error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.redirect(
      new URL("/checkout?error=payment_return_error", request.url)
    );
  }
}

