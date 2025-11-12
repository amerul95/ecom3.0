import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature, mapTransactionStateToPaymentStatus, mapTransactionStateToOrderStatus } from "@/services/payments/oxpay-v2";

/**
 * POST /api/payments/oxpay-v2/webhook
 * Webhook handler for payment status updates from OxPay
 * Verifies signature and updates payment/order status
 */
export async function POST(request: NextRequest) {
  console.log("🔵 [WEBHOOK v2] POST /api/payments/oxpay-v2/webhook called");
  console.log("📋 [WEBHOOK v2] Request headers:", Object.fromEntries(request.headers.entries()));

  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    console.log("📦 [WEBHOOK v2] Raw webhook payload:", rawBody);

    // Get signature from header
    const signature = request.headers.get("Signature") || request.headers.get("signature") || "";
    console.log("🔐 [WEBHOOK v2] Received signature:", signature);

    if (!signature) {
      console.warn("⚠️ [WEBHOOK v2] No signature provided - skipping verification");
    } else {
      // Verify signature
      const isValid = verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.error("❌ [WEBHOOK v2] Invalid webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
      console.log("✅ [WEBHOOK v2] Signature verified successfully");
    }

    // Parse webhook payload
    const body = JSON.parse(rawBody);
    console.log("📦 [WEBHOOK v2] Parsed webhook payload:", JSON.stringify(body, null, 2));

    // Extract payment details from webhook
    const webhookBody = body.body || body;
    const merchantReferenceId = webhookBody.merchant_reference_id;
    const oxpayTxnId = webhookBody.oxpay_txn_id;
    const transactionState = webhookBody.transaction_state;
    const transactionAmount = webhookBody.transaction_amount;
    const transactionCurrency = webhookBody.transaction_currency;
    const paymentBrand = webhookBody.payment_brand;

    console.log("🔍 [WEBHOOK v2] Extracted data:", {
      merchantReferenceId,
      oxpayTxnId,
      transactionState,
      transactionAmount,
      transactionCurrency,
      paymentBrand,
    });

    if (!merchantReferenceId) {
      console.error("❌ [WEBHOOK v2] Missing merchant_reference_id in payload");
      return NextResponse.json(
        { error: "Missing merchant_reference_id" },
        { status: 400 }
      );
    }

    // Find payment by merchant reference ID (order ID)
    console.log("🔍 [WEBHOOK v2] Searching for payment with merchant reference:", merchantReferenceId);
    const payment = await prisma.payment.findFirst({
      where: {
        orderId: merchantReferenceId,
      },
      include: {
        order: true,
      },
    });

    console.log("📦 [WEBHOOK v2] Payment found:", {
      paymentId: payment?.id,
      orderId: payment?.orderId,
      currentStatus: payment?.status,
      currentOrderStatus: payment?.order?.status,
    });

    if (!payment) {
      console.error("❌ [WEBHOOK v2] Payment not found for merchant_reference_id:", merchantReferenceId);
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Map transaction state to internal statuses
    console.log("🔄 [WEBHOOK v2] Mapping transaction state:", transactionState);
    const paymentStatus = mapTransactionStateToPaymentStatus(transactionState);
    const orderStatus = mapTransactionStateToOrderStatus(transactionState);

    console.log("📝 [WEBHOOK v2] Status mapping result:", {
      paymentStatus,
      orderStatus,
      previousPaymentStatus: payment.status,
      previousOrderStatus: payment.order.status,
    });

    // Update payment and order in transaction
    console.log("💾 [WEBHOOK v2] Updating payment and order in database...");
    await prisma.$transaction(async (tx) => {
      // Update payment
      console.log("💾 [WEBHOOK v2] Updating payment record:", {
        paymentId: payment.id,
        newStatus: paymentStatus,
        newProviderRef: oxpayTxnId || payment.providerRef,
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentStatus,
          providerRef: oxpayTxnId || payment.providerRef,
          rawPayload: body,
        },
      });

      // Update order status
      console.log("💾 [WEBHOOK v2] Updating order status:", {
        orderId: payment.orderId,
        newStatus: orderStatus,
      });

      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: orderStatus,
        },
      });
    });

    console.log("✅ [WEBHOOK v2] Payment and order updated successfully");

    // Return success response to OxPay
    const response = {
      headers: {
        status_code: 0,
        status_message: "SUCCESS",
        gateway_response_datetime: new Date().toISOString().replace(/[-:]/g, "").split(".")[0],
      },
    };

    console.log("✅ [WEBHOOK v2] Sending success response to OxPay:", response);
    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("❌ [WEBHOOK v2] POST /api/payments/oxpay-v2/webhook error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        headers: {
          status_code: 99,
          status_message: error instanceof Error ? error.message : "Internal server error",
          gateway_response_datetime: new Date().toISOString().replace(/[-:]/g, "").split(".")[0],
        },
      },
      { status: 500 }
    );
  }
}

