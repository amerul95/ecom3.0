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

const bulkProductSchema = z.object({
  products: z.array(productSchema).min(1, "At least one product is required").max(50, "Maximum 50 products per bulk upload"),
});

// POST /api/admin/products/bulk - Create multiple products
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();

    // Validate bulk request
    const validated = bulkProductSchema.parse(body);

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
      console.log("✅ Updated admin user with store name:", dbUser.id);
    }

    // Create products in transaction
    const createdProducts = [];
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < validated.products.length; i++) {
      const productData = validated.products[i];
      
      try {
        // Generate unique slug
        let slug = generateSlug(productData.name);
        let slugExists = await prisma.product.findUnique({ where: { slug } });
        let counter = 1;
        while (slugExists) {
          slug = `${generateSlug(productData.name)}-${counter}`;
          slugExists = await prisma.product.findUnique({ where: { slug } });
          counter++;
        }

        // Create product with variants
        const product = await prisma.product.create({
          data: {
            name: productData.name,
            slug,
            description: productData.description,
            price: productData.price,
            stock: productData.stock,
            status: productData.status ?? "ACTIVE",
            images: productData.images,
            categoryId: productData.categoryId || null,
            sellerId: dbUser.id,
            variants: productData.variants && productData.variants.length > 0
              ? {
                  create: productData.variants.map((v) => ({
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

        createdProducts.push(product);
      } catch (error: any) {
        console.error(`Error creating product ${i + 1}:`, error);
        errors.push({
          index: i,
          error: error.message || "Failed to create product",
        });
      }
    }

    // Return results
    if (createdProducts.length === 0) {
      return NextResponse.json(
        {
          error: "Failed to create any products",
          details: errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: `Successfully created ${createdProducts.length} product(s)`,
        products: createdProducts,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          total: validated.products.length,
          created: createdProducts.length,
          failed: errors.length,
        },
      },
      { status: 201 }
    );
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
    console.error("POST /api/admin/products/bulk error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message || "Failed to create products",
      },
      { status: 500 }
    );
  }
}
