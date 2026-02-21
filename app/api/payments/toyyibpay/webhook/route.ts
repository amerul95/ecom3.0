import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyCallbackHash,
  mapToyyibpayStatusToPaymentStatus,
  mapToyyibpayStatusToOrderStatus,
} from "@/Payment/handler/ToyyibpayHandler";

/**
 * POST /api/payments/toyyibpay/webhook
 * Callback handler - ToyyibPay sends POST with: refno, status, order_id, billcode, reason, amount, transaction_time, hash
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const status = String(formData.get("status") ?? "");
    const orderId = String(formData.get("order_id") ?? "");
    const refno = String(formData.get("refno") ?? "");
    const hash = String(formData.get("hash") ?? "");
    const amount = formData.get("amount");
    const billcode = formData.get("billcode");

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing order_id" },
        { status: 400 }
      );
    }

    if (hash && !verifyCallbackHash(status, orderId, refno, hash)) {
      return NextResponse.json({ error: "Invalid hash" }, { status: 401 });
    }

    const payment = await prisma.payment.findFirst({
      where: { orderId },
      include: { order: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const paymentStatus = mapToyyibpayStatusToPaymentStatus(status);
    const orderStatus = mapToyyibpayStatusToOrderStatus(status);

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentStatus,
          providerRef: refno || billcode?.toString() || payment.providerRef,
          rawPayload: {
            refno,
            status,
            order_id: orderId,
            billcode: billcode?.toString(),
            amount: amount?.toString(),
          },
        },
      });
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: orderStatus },
      });
    });

    return NextResponse.json({ status: "OK" });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
