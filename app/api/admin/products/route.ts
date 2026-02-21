import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/policy/auth.policy";
import { productSchema } from "@/server/dto/product.dto";
import { z } from "zod";

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// GET /api/admin/products - Get all products (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Ensure admin user exists and has storeName set (single seller model)
    // Try to find user by ID first, then by email if ID doesn't match (session might be stale)
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, storeName: true, verified: true },
    });

    // If user not found by ID, try by email (session might have stale ID after DB reset)
    if (!dbUser && user.email) {
      dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true, storeName: true, verified: true },
      });
      
      // If found by email, session has stale ID (likely after DB reset)
      // This is fine - we'll use the database user ID for queries
      if (dbUser) {
        // Silent fallback - user should log out/in to refresh session, but this works for now
      }
    }

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found in database. Please log out and log back in." },
        { status: 404 }
      );
    }

    if (!dbUser.storeName) {
      // Auto-set store name for admin
      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          storeName: "Admin Store",
          verified: true,
        },
      });
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { sellerId: dbUser.id },
        include: {
          category: true,
          variants: true,
          _count: {
            select: {
              reviews: true,
              orderItems: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where: { sellerId: dbUser.id } }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/products - Create product (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();

    // Ensure admin user exists and has storeName set
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, storeName: true, verified: true },
    });

    // If user not found by ID, try by email (session might have stale ID after DB reset)
    if (!dbUser && user.email) {
      dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true, storeName: true, verified: true },
      });
    }

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found in database. Please log out and log back in." },
        { status: 404 }
      );
    }

    if (!dbUser.storeName) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          storeName: "Admin Store",
          verified: true,
        },
      });
    }

    // Validate input
    const validated = productSchema.parse(body);

    // Generate unique slug
    let slug = generateSlug(validated.name);
    let slugExists = await prisma.product.findUnique({ where: { slug } });
    let counter = 1;
    while (slugExists) {
      slug = `${generateSlug(validated.name)}-${counter}`;
      slugExists = await prisma.product.findUnique({ where: { slug } });
      counter++;
    }

    // Create product with variants
    const product = await prisma.product.create({
      data: {
        name: validated.name,
        slug,
        description: validated.description,
        price: validated.price,
        stock: validated.stock,
        status: validated.status ?? "ACTIVE",
        images: validated.images,
        categoryId: validated.categoryId || null,
        sellerId: dbUser.id,
        variants: validated.variants && validated.variants.length > 0
          ? {
              create: validated.variants.map((v) => ({
                name: v.name,
                sku: v.sku,
                price: v.price !== null && v.price !== undefined ? v.price : null,
                stock: v.stock,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        variants: true,
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            storeName: true,
          },
        },
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
