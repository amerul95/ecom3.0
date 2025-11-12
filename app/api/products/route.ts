import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { errorToResponse, ValidationError } from "@/lib/errors";
import { PAGINATION_DEFAULTS } from "@/types";

const productQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : PAGINATION_DEFAULTS.page)),
  limit: z.string().optional().transform((val) => {
    const parsed = val ? parseInt(val, 10) : PAGINATION_DEFAULTS.limit;
    return Math.min(parsed, PAGINATION_DEFAULTS.maxLimit);
  }),
  categoryId: z.string().optional(),
  sellerId: z.string().optional(),
  minPrice: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  maxPrice: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  search: z.string().optional(),
  sortBy: z.enum(["name", "price", "createdAt", "updatedAt"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

/**
 * GET /api/products
 * List products with filtering, sorting, and pagination
 * Public endpoint - no authentication required
 * @returns Paginated list of products with ratings
 */
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

    // Validate price range
    if (validated.minPrice !== undefined && validated.maxPrice !== undefined) {
      if (validated.minPrice > validated.maxPrice) {
        throw new ValidationError("minPrice cannot be greater than maxPrice");
      }
    }

    const page = validated.page;
    const limit = validated.limit;
    const skip = (page - 1) * limit;

    // Build where clause with proper typing
    const where: {
      categoryId?: string;
      sellerId?: string;
      price?: { gte?: number; lte?: number };
      OR?: Array<{ name?: { contains: string; mode: "insensitive" }; description?: { contains: string; mode: "insensitive" } }>;
      seller: { verified: boolean };
    } = {
      seller: {
        verified: true,
      },
    };

    if (validated.categoryId) {
      where.categoryId = validated.categoryId;
    }

    if (validated.sellerId) {
      where.sellerId = validated.sellerId;
    }

    if (validated.minPrice !== undefined || validated.maxPrice !== undefined) {
      where.price = {};
      if (validated.minPrice !== undefined) {
        where.price.gte = validated.minPrice;
      }
      if (validated.maxPrice !== undefined) {
        where.price.lte = validated.maxPrice;
      }
    }

    if (validated.search) {
      where.OR = [
        { name: { contains: validated.search, mode: "insensitive" } },
        { description: { contains: validated.search, mode: "insensitive" } },
      ];
    }

    const sortBy = validated.sortBy;
    const sortOrder = validated.sortOrder;

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








