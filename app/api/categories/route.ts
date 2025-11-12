import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDefaultCategories } from "@/lib/default-categories";

// GET /api/categories - Get all categories (public endpoint)
export async function GET(request: NextRequest) {
  try {
    await ensureDefaultCategories();

    const searchParams = request.nextUrl.searchParams;
    const includeProducts = searchParams.get("includeProducts") === "true";
    const parentId = searchParams.get("parentId");

    // Build where clause - handle parentId query param
    let where: any = {};
    if (parentId !== null) {
      if (parentId === "") {
        // Empty string means get root categories (no parent)
        where = { parentId: null };
      } else {
        // Specific parent ID
        where = { parentId };
      }
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        children: true,
        products: includeProducts
          ? {
              take: 10, // Limit products per category
              include: {
                seller: {
                  include: {
                    user: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            }
          : false,
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error("GET /api/categories error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });
    
    // Check if it's a database schema issue
    if (error.code === 'P2001' || error.message?.includes('does not exist') || error.message?.includes('Unknown table')) {
      return NextResponse.json(
        { 
          error: "Database schema not initialized",
          message: "Please run database migrations: npm run db:push",
          details: "The Category table does not exist in the database. Run migrations to create it.",
          code: "SCHEMA_NOT_INITIALIZED",
        },
        { status: 500 }
      );
    }
    
    // Provide more detailed error message for debugging
    const errorMessage = error.message || "Internal server error";
    const errorCode = error.code || "UNKNOWN_ERROR";
    
    return NextResponse.json(
      { 
        error: "Failed to fetch categories",
        details: errorMessage,
        code: errorCode,
      },
      { status: 500 }
    );
  }
}
