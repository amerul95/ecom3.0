import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDefaultCategories } from "@/lib/default-categories";

// GET /api/categories/[slug] - Get category by slug with products
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await ensureDefaultCategories();

    const { slug } = await params;

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const search = searchParams.get("search")?.trim() || undefined;
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        children: true,
        parent: true,
      },
    });

    if (!category) {
      // Check if any categories exist at all
      const allCategories = await prisma.category.findMany({
        select: { slug: true, name: true },
        take: 10,
      });

      return NextResponse.json(
        { 
          error: "Category not found",
          message: `Category with slug "${slug}" does not exist`,
          availableCategories: allCategories.map(c => ({ slug: c.slug, name: c.name })),
        },
        { status: 404 }
      );
    }

    // Build product filter (only active products for storefront)
    const productWhere: any = {
      categoryId: category.id,
      status: "ACTIVE",
    };

    if (minPrice || maxPrice) {
      productWhere.price = {};
      if (minPrice) {
        productWhere.price.gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        productWhere.price.lte = parseFloat(maxPrice);
      }
    }

    if (search) {
      productWhere.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Only show products from verified sellers
    // TODO: Re-enable this filter for production
    // For now, show all products regardless of seller verification status
    // productWhere.seller = {
    //   verified: true,
    // };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: productWhere,
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
      prisma.product.count({ where: productWhere }),
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

    const response = {
      category,
      products: productsWithRating,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

