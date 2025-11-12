import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/auth-helpers";
import { productUpdateSchema } from "@/lib/validations";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.string().cuid(),
});

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSeller();
    const { id } = paramsSchema.parse(await context.params);

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
    });

    if (!sellerProfile) {
      return NextResponse.json(
        { error: "Seller profile not found." },
        { status: 404 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
      },
    });

    if (!product || product.sellerId !== sellerProfile.id) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error("GET /api/seller/products/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product.", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSeller();
    const body = await request.json();
    const { id } = paramsSchema.parse(await context.params);

    // Ensure we have a seller profile
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
    });

    if (!sellerProfile) {
      return NextResponse.json(
        { error: "Seller profile not found." },
        { status: 404 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!product || product.sellerId !== sellerProfile.id) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    // Normalize incoming payload to satisfy validation schema
    const normalizedPayload: any = { ...body };

    if (typeof normalizedPayload.price === "string") {
      normalizedPayload.price = parseFloat(normalizedPayload.price);
    }
    if (typeof normalizedPayload.stock === "string") {
      normalizedPayload.stock = parseInt(normalizedPayload.stock, 10);
    }

    if (Array.isArray(normalizedPayload.variants)) {
      normalizedPayload.variants = normalizedPayload.variants.map(
        (variant: any) => {
          const v = { ...variant };
          if (typeof v.price === "string" && v.price !== "") {
            v.price = parseFloat(v.price);
          }
          if (v.price === "" || v.price === null) {
            v.price = null;
          }
          if (typeof v.stock === "string") {
            v.stock = parseInt(v.stock, 10);
          }
          return v;
        }
      );
    }

    const validated = productUpdateSchema.parse(normalizedPayload);

    const updateData: any = {};

    if (validated.name && validated.name !== product.name) {
      let newSlug = generateSlug(validated.name);
      if (newSlug !== product.slug) {
        let slugExists = await prisma.product.findFirst({
          where: {
            slug: newSlug,
            NOT: { id: product.id },
          },
        });

        let counter = 1;
        while (slugExists) {
          newSlug = `${generateSlug(validated.name)}-${counter}`;
          slugExists = await prisma.product.findFirst({
            where: {
              slug: newSlug,
              NOT: { id: product.id },
            },
          });
          counter++;
        }
      }
      updateData.name = validated.name;
      updateData.slug = newSlug;
    }

    if (validated.description !== undefined) {
      updateData.description = validated.description;
    }
    if (validated.price !== undefined) {
      updateData.price = validated.price;
    }
    if (validated.stock !== undefined) {
      updateData.stock = validated.stock;
    }
    if (validated.images !== undefined) {
      updateData.images = validated.images;
    }
    if (validated.categoryId !== undefined) {
      updateData.categoryId = validated.categoryId || null;
    }

    const variantPayload = Array.isArray(validated.variants)
      ? validated.variants
      : null;

    const updatedProduct = await prisma.$transaction(async (tx) => {
      if (variantPayload) {
        await tx.variant.deleteMany({
          where: { productId: product.id },
        });
      }

      return tx.product.update({
        where: { id: product.id },
        data: {
          ...updateData,
          ...(variantPayload
            ? {
                variants: {
                  create: variantPayload.map((variant) => ({
                    name: variant.name,
                    sku: variant.sku,
                    price: variant.price ?? null,
                    stock: variant.stock,
                  })),
                },
              }
            : {}),
        },
        include: {
          category: true,
          variants: true,
        },
      });
    });

    return NextResponse.json({
      message: "Product updated successfully.",
      product: updatedProduct,
    });
  } catch (error: any) {
    console.error("PATCH /api/seller/products/[id] error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    if (error.code === "P2002") {
      return NextResponse.json(
        {
          error: "Duplicate value detected.",
          details: error.meta,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update product.", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSeller();
    const { id } = paramsSchema.parse(await context.params);

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
    });

    if (!sellerProfile) {
      return NextResponse.json(
        { error: "Seller profile not found." },
        { status: 404 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product || product.sellerId !== sellerProfile.id) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Product deleted successfully." });
  } catch (error: any) {
    console.error("DELETE /api/seller/products/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete product.", details: error.message },
      { status: 500 }
    );
  }
}


