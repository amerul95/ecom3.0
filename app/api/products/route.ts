import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const productQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  categoryId: z.string().optional(),
  sellerId: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// GET /api/products - List products (public endpoint with filters)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const validated = productQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      categoryId: searchParams.get("categoryId"),
      sellerId: searchParams.get("sellerId"),
      minPrice: searchParams.get("minPrice"),
      maxPrice: searchParams.get("maxPrice"),
      search: searchParams.get("search"),
      sortBy: searchParams.get("sortBy"),
      sortOrder: searchParams.get("sortOrder"),
    });

    const page = parseInt(validated.page || "1");
    const limit = parseInt(validated.limit || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (validated.categoryId) {
      where.categoryId = validated.categoryId;
    }

    if (validated.sellerId) {
      where.sellerId = validated.sellerId;
    }

    if (validated.minPrice || validated.maxPrice) {
      where.price = {};
      if (validated.minPrice) {
        where.price.gte = parseFloat(validated.minPrice);
      }
      if (validated.maxPrice) {
        where.price.lte = parseFloat(validated.maxPrice);
      }
    }

    if (validated.search) {
      where.OR = [
        { name: { contains: validated.search, mode: "insensitive" } },
        { description: { contains: validated.search, mode: "insensitive" } },
      ];
    }

    // Only show products from verified sellers
    where.seller = {
      verified: true,
    };

    const sortBy = validated.sortBy || "createdAt";
    const sortOrder = validated.sortOrder || "desc";

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          seller: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate average ratings
    const productsWithRating = products.map((product) => {
      const avgRating =
        product.reviews.length > 0
          ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
            product.reviews.length
          : 0;

      return {
        ...product,
        averageRating: avgRating,
        reviewCount: product._count.reviews,
        reviews: undefined, // Remove reviews array from response
      };
    });

    return NextResponse.json({
      products: productsWithRating,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}







