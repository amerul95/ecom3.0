import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/payments/toyyibpay/return
 * Return URL - ToyyibPay redirects here after payment
 * Params: status_id (1=success, 2=pending, 3=fail), billcode, order_id
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const statusId = searchParams.get("status_id");
  const orderId = searchParams.get("order_id");
  const billcode = searchParams.get("billcode");

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    request.headers.get("origin") ||
    "http://localhost:3000";

  const reference = orderId || billcode;
  if (!reference) {
    return NextResponse.redirect(
      new URL("/checkout?error=missing_reference", baseUrl)
    );
  }

  const params = new URLSearchParams({ ref: reference });
  if (statusId === "3") params.set("status", "failed");
  if (statusId === "2") params.set("status", "pending");

  return NextResponse.redirect(
    new URL(`/checkout/receipt?${params.toString()}`, baseUrl)
  );
}
