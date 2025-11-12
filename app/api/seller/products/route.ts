import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/auth-helpers";
import { productSchema } from "@/lib/validations";
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

// GET /api/seller/products - Get seller's products
export async function GET(request: NextRequest) {
  try {
    const user = await requireSeller();
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Get seller profile
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
    });

    if (!sellerProfile) {
      // Return empty products array instead of 404
      // Seller profile might not be created yet
      return NextResponse.json({
        products: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
        message: "Seller profile not found. Please complete your seller profile setup.",
      });
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { sellerId: sellerProfile.id },
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
      prisma.product.count({ where: { sellerId: sellerProfile.id } }),
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
    console.error("GET /api/seller/products error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    
    // Check if it's a database schema issue
    if (error.code === 'P2001' || error.code === 'P2025' || error.message?.includes('does not exist') || error.message?.includes('Unknown table')) {
      return NextResponse.json(
        { 
          error: "Database schema not initialized",
          message: "Please run database migrations: npm run db:push --accept-data-loss",
          details: error.message,
          code: "SCHEMA_NOT_INITIALIZED",
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error.message,
        code: error.code || "UNKNOWN_ERROR",
      },
      { status: 500 }
    );
  }
}

// POST /api/seller/products - Create product
export async function POST(request: NextRequest) {
  try {
    const user = await requireSeller();
    const body = await request.json();

    // Get or create seller profile
    let sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
    });

    if (!sellerProfile) {
      // Get user details from database for store name
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true, email: true },
      });
      
      // Auto-create seller profile if user has SELLER role but no profile
      sellerProfile = await prisma.sellerProfile.create({
        data: {
          userId: user.id,
          storeName: dbUser?.name ? `${dbUser.name}'s Store` : `Store ${dbUser?.email.split('@')[0] || 'Unknown'}`,
          verified: false, // Requires admin approval
        },
      });
      console.log("✅ Auto-created seller profile for user:", user.id);
    }

    // Verification check disabled for testing
    // TODO: Re-enable verification check for production
    // if (!sellerProfile.verified) {
    //   return NextResponse.json(
    //     { 
    //       error: "Seller account not verified. Please wait for admin approval.",
    //       message: "Your seller profile has been created but is pending verification. You cannot create products until an admin verifies your account.",
    //     },
    //     { status: 403 }
    //   );
    // }

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
        images: validated.images,
        categoryId: validated.categoryId || null,
        sellerId: sellerProfile.id,
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
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
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
    console.error("POST /api/seller/products error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

