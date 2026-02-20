import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/server/policy/auth.policy";
import { createBill } from "@/Payment/handler/ToyyibpayHandler";
import { z } from "zod";
import { errorToResponse } from "@/lib/errors";
import { CURRENCY } from "@/types";

const createPaymentIntentSchema = z.object({
  orderId: z.string().cuid(),
});

/**
 * POST /api/payments/toyyibpay/intent
 * Create ToyyibPay bill and get payment URL (sandbox)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireBuyer();
    const body = await request.json();
    const { orderId } = createPaymentIntentSchema.parse(body);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (!order.payment) {
      return NextResponse.json(
        { error: "Payment record not found for this order" },
        { status: 400 }
      );
    }
    if (order.payment.status === "CAPTURED" || order.status === "PAID") {
      return NextResponse.json({ error: "Order already paid" }, { status: 400 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000";
    const returnUrl = `${baseUrl}/api/payments/toyyibpay/return`;
    const callbackUrl = `${baseUrl}/api/payments/toyyibpay/webhook`;

    const { paymentUrl, billCode } = await createBill({
      orderId,
      description: `Order ${orderId}`,
      amount: Number(order.total),
      returnUrl,
      callbackUrl,
      payerName: order.user.name || "Customer",
      payerEmail: order.user.email || user.email,
      payerPhone: "0000000000",
    });

    await prisma.payment.update({
      where: { orderId },
      data: { providerRef: billCode, status: "INITIATED" },
    });

    return NextResponse.json({
      paymentUrl,
      billCode,
      orderId,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    const { status, body } = errorToResponse(error);
    return NextResponse.json(body, { status });
  }
}
