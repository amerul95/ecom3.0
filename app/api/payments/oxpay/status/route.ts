import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/lib/auth-helpers";
import { verifyWebhookSignature, OxPayState } from "@/services/payments/oxpay";

// GET /api/payments/oxpay/status - Get payment status by reference number
export async function GET(request: NextRequest) {
  try {
    const user = await requireBuyer();
    const searchParams = request.nextUrl.searchParams;
    const ref = searchParams.get("ref");

    if (!ref) {
      return NextResponse.json(
        { error: "Missing reference number" },
        { status: 400 }
      );
    }

    // Find payment by reference number
    const payment = await prisma.payment.findFirst({
      where: {
        providerRef: ref,
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    images: true,
                  },
                },
                variant: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Verify order belongs to user
    if (payment.order.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    return NextResponse.json(payment);
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("GET /api/payments/oxpay/status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/payments/oxpay/status - Webhook handler for payment status updates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract reference number and other payment details
    const referenceNo = body.referenceNo || body.reference_no;
    const state = body.state || body.transactionState || body.status;
    const respCode = body.respCode || body.resp_code;
    const respMsg = body.respMsg || body.resp_msg;
    const providerRef = body.providerRef || body.provider_ref || body.transactionId;
    const receiptNumber = body.receiptNumber || body.receipt_number;
    const brandName = body.brandName || body.brand_name;
    const truncatedPan = body.truncatedPan || body.truncated_pan;
    const signature = body.signature;

    if (!referenceNo) {
      return NextResponse.json(
        { error: "Missing referenceNo" },
        { status: 400 }
      );
    }

    // Verify signature if provided (recommended for production)
    if (signature) {
      const isValid = verifyWebhookSignature(body, signature);
      if (!isValid) {
        console.error("Invalid webhook signature:", referenceNo);
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    // Find payment by reference number
    const payment = await prisma.payment.findFirst({
      where: {
        providerRef: referenceNo,
      },
      include: {
        order: true,
      },
    });

    if (!payment) {
      console.error("Payment not found for referenceNo:", referenceNo);
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Map OxPay state to PaymentStatus enum
    let paymentStatus: "INITIATED" | "AUTHORIZED" | "CAPTURED" | "FAILED" | "REFUNDED" = "INITIATED";
    let orderStatus: "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED" = "PENDING";

    if (state === OxPayState.AUTHORIZED || state === "2") {
      paymentStatus = "CAPTURED";
      orderStatus = "PAID";
    } else if (state === OxPayState.FAILED || state === "3") {
      paymentStatus = "FAILED";
      orderStatus = "CANCELLED";
    } else if (state === OxPayState.CANCELLED || state === "4") {
      paymentStatus = "FAILED";
      orderStatus = "CANCELLED";
    } else if (state === OxPayState.REFUNDED || state === "5") {
      paymentStatus = "REFUNDED";
      orderStatus = "REFUNDED";
    } else if (state === OxPayState.VOIDED || state === "6") {
      paymentStatus = "FAILED";
      orderStatus = "CANCELLED";
    }

    // Update payment and order in transaction
    await prisma.$transaction(async (tx) => {
      // Update payment
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentStatus,
          providerRef: providerRef || payment.providerRef,
          rawPayload: body,
        },
      });

      // Update order status
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: orderStatus,
        },
      });
    });

    // Return success response to OxPay
    return NextResponse.json({
      respCode: "00",
      respMsg: "Success",
    });
  } catch (error: any) {
    console.error("POST /api/payments/oxpay/status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
