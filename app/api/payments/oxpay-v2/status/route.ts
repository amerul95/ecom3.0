import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/server/policy/auth.policy";
import { errorToResponse } from "@/lib/errors";

/**
 * GET /api/payments/oxpay-v2/status
 * Get payment status by reference (order ID or session ID)
 * @returns Payment and order details
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireBuyer();

    const searchParams = request.nextUrl.searchParams;
    const ref = searchParams.get("ref") || searchParams.get("orderId");

    if (!ref) {
      return NextResponse.json(
        { error: "Missing reference number" },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { orderId: ref },
          { providerRef: ref },
        ],
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

