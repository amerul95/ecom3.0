import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature, mapTransactionStateToPaymentStatus, mapTransactionStateToOrderStatus } from "@/Payment/handler/OxpayHandler";

/**
 * POST /api/payments/oxpay-v2/webhook
 * Webhook handler for payment status updates from OxPay
 * Verifies signature and updates payment/order status
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();

    // Get signature from header
    const signature = request.headers.get("Signature") || request.headers.get("signature") || "";

    if (signature) {
      const isValid = verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    // Parse webhook payload
    const body = JSON.parse(rawBody);

    // Extract payment details from webhook
    const webhookBody = body.body || body;
    const merchantReferenceId = webhookBody.merchant_reference_id;
    const oxpayTxnId = webhookBody.oxpay_txn_id;
    const transactionState = webhookBody.transaction_state;
    const transactionAmount = webhookBody.transaction_amount;
    const transactionCurrency = webhookBody.transaction_currency;
    const paymentBrand = webhookBody.payment_brand;

    if (!merchantReferenceId) {
      return NextResponse.json(
        { error: "Missing merchant_reference_id" },
        { status: 400 }
      );
    }

    // Find payment by merchant reference ID (order ID)
    const payment = await prisma.payment.findFirst({
      where: {
        orderId: merchantReferenceId,
      },
      include: {
        order: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Map transaction state to internal statuses
    const paymentStatus = mapTransactionStateToPaymentStatus(transactionState);
    const orderStatus = mapTransactionStateToOrderStatus(transactionState);

    // Update payment and order in transaction
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentStatus,
          providerRef: oxpayTxnId || payment.providerRef,
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
    const response = {
      headers: {
        status_code: 0,
        status_message: "SUCCESS",
        gateway_response_datetime: new Date().toISOString().replace(/[-:]/g, "").split(".")[0],
      },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
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

