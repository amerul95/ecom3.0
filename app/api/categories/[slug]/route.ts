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
    console.log('🔍 API: Fetching category by slug:', slug);
    
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    console.log('📋 Query params:', { page, limit, skip, minPrice, maxPrice, sortBy, sortOrder });

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        children: true,
        parent: true,
      },
    });

    console.log('📁 Category found:', category ? {
      id: category.id,
      name: category.name,
      slug: category.slug,
      hasChildren: category.children.length > 0,
      hasParent: !!category.parent
    } : 'NOT FOUND');

    if (!category) {
      console.log('❌ Category not found for slug:', slug);
      
      // Check if any categories exist at all
      const allCategories = await prisma.category.findMany({
        select: { slug: true, name: true },
        take: 10,
      });
      console.log('📋 Available categories in database:', allCategories);
      
      return NextResponse.json(
        { 
          error: "Category not found",
          message: `Category with slug "${slug}" does not exist`,
          availableCategories: allCategories.map(c => ({ slug: c.slug, name: c.name })),
        },
        { status: 404 }
      );
    }

    // Build product filter
    const productWhere: any = {
      categoryId: category.id,
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

    // Only show products from verified sellers
    // TODO: Re-enable this filter for production
    // For now, show all products regardless of seller verification status
    // productWhere.seller = {
    //   verified: true,
    // };

    console.log('🔎 Product filter (where clause):', JSON.stringify(productWhere, null, 2));

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: productWhere,
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
      prisma.product.count({ where: productWhere }),
    ]);

    console.log('📦 Raw products from database:', products.length);
    console.log('📊 Total products count:', total);
    console.log('📋 Products details:', products.map(p => ({
      id: p.id,
      name: p.name,
      categoryId: p.categoryId,
      sellerId: p.sellerId,
      images: p.images?.length || 0
    })));

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

    console.log('✅ API Response:', {
      categoryName: category.name,
      categorySlug: category.slug,
      productsCount: productsWithRating.length,
      totalProducts: total,
      pagination: response.pagination
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("GET /api/categories/[slug] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

