import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/server/policy/auth.policy";
import { errorToResponse } from "@/lib/errors";

/**
 * GET /api/payments/toyyibpay/status?ref=<orderId|billCode>
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireBuyer();
    const ref =
      request.nextUrl.searchParams.get("ref") ||
      request.nextUrl.searchParams.get("orderId");

    if (!ref) {
      return NextResponse.json(
        { error: "Missing reference" },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [{ orderId: ref }, { providerRef: ref }],
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: { select: { id: true, name: true, images: true } },
                variant: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    if (payment.order.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({
      payment: {
        id: payment.id,
        status: payment.status,
        providerRef: payment.providerRef,
        amount: payment.amount.toString(),
        currency: payment.currency,
      },
      order: {
        id: payment.order.id,
        status: payment.order.status,
        total: payment.order.total.toString(),
        items: payment.order.items,
      },
    });
  } catch (error: unknown) {
    const { status, body } = errorToResponse(error);
    return NextResponse.json(body, { status });
  }
}
