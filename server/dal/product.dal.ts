import { prisma } from "@/lib/prisma";
import {
  productQuerySchema,
  type ProductListResponse,
} from "../dto/product.dto";
import { ValidationError } from "@/lib/errors";

export async function getProducts(
  query: Record<string, string | undefined>
): Promise<ProductListResponse> {
  const validated = productQuerySchema.parse(query);

  // Validate price range
  if (validated.minPrice !== undefined && validated.maxPrice !== undefined) {
    if (validated.minPrice > validated.maxPrice) {
      throw new ValidationError("minPrice cannot be greater than maxPrice");
    }
  }

  const page = validated.page;
  const limit = validated.limit;
  const skip = (page - 1) * limit;
  const sortBy = validated.sortBy;
  const sortOrder = validated.sortOrder;

  const where: {
    categoryId?: string;
    status?: "ACTIVE";
    price?: { gte?: number; lte?: number };
    OR?: Array<{
      name?: { contains: string; mode: "insensitive" };
      description?: { contains: string; mode: "insensitive" };
    }>;
  } = {
    status: "ACTIVE",
  };

  if (validated.categoryId) {
    where.categoryId = validated.categoryId;
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

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
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

  const productsWithRating = products.map((product) => {
    const avgRating =
      product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
          product.reviews.length
        : 0;

    const { reviews, _count, ...rest } = product;
    return {
      ...rest,
      price: Number(product.price),
      averageRating: avgRating,
      reviewCount: _count.reviews,
    };
  });

  return {
    products: productsWithRating,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}
