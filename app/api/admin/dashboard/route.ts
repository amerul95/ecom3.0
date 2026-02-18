import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAdmin();

    let dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    });

    if (!dbUser && user.email) {
      dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true },
      });
    }

    const sellerId = dbUser?.id;

    const products = await prisma.product.findMany({
      ...(sellerId && { where: { sellerId } }),
      include: {
        category: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const totalItems = products.length;
    const activeItems = products.filter((p) => p.stock > 0).length;

    const revenueResult = await prisma.order.aggregate({
      where: {
        status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
        ...(sellerId && {
          items: {
            some: {
              product: { sellerId },
            },
          },
        }),
      },
      _sum: { total: true },
    });
    const totalRevenue = Number(revenueResult._sum.total ?? 0);

    const productsForClient = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      stock: p.stock,
      category: p.category ? { name: p.category.name } : null,
    }));

    return NextResponse.json({
      products: productsForClient,
      totalItems,
      activeItems,
      totalRevenue,
    });
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message.includes("Forbidden"))) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("GET /api/admin/dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
