/**
 * Debug script to check products and why they're not showing
 * Run with: tsx scripts/debug-products.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function debugProducts() {
  console.log("🔍 Debugging Products...\n");

  try {
    // 1. Check all products
    const allProducts = await prisma.product.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        seller: {
          select: {
            id: true,
            storeName: true,
            verified: true,
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`📦 Total products in database: ${allProducts.length}\n`);

    if (allProducts.length === 0) {
      console.log("❌ No products found in database!");
      console.log("💡 Make sure you've created products via the seller dashboard.");
      return;
    }

    // 2. Display all products
    console.log("┌─────────────────────────────────────────────────────────────────────────┐");
    console.log("│ All Products                                                           │");
    console.log("├─────────────────────────────────────────────────────────────────────────┤");

    allProducts.forEach((product, index) => {
      const categoryName = product.category?.name || "No Category";
      const categorySlug = product.category?.slug || "N/A";
      const sellerName = product.seller?.storeName || "Unknown";
      const verified = product.seller?.verified ? "✅" : "❌";
      const hasCategory = product.categoryId ? "✅" : "❌";

      console.log(
        `│ ${(index + 1).toString().padStart(2)}. ${product.name.padEnd(30)} │ ${categoryName.padEnd(15)} │ ${sellerName.padEnd(20)} │ ${verified} │ ${hasCategory} │`
      );
    });

    console.log("└─────────────────────────────────────────────────────────────────────────┘\n");

    // 3. Check products by category
    console.log("📊 Products by Category:\n");
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    categories.forEach((cat) => {
      const productsInCategory = allProducts.filter(
        (p) => p.categoryId === cat.id
      );
      const verifiedProducts = productsInCategory.filter(
        (p) => p.seller?.verified === true
      );

      console.log(`  ${cat.name} (${cat.slug}):`);
      console.log(`    - Total products: ${productsInCategory.length}`);
      console.log(`    - Verified seller products: ${verifiedProducts.length}`);
      console.log(
        `    - Will show on category page: ${verifiedProducts.length > 0 ? "✅ YES" : "❌ NO (seller not verified)"}`
      );
      console.log("");
    });

    // 4. Check apparel category specifically
    const apparelCategory = await prisma.category.findUnique({
      where: { slug: "apparel" },
      include: {
        products: {
          include: {
            seller: {
              select: {
                verified: true,
                storeName: true,
              },
            },
          },
        },
      },
    });

    if (apparelCategory) {
      console.log("👕 Apparel Category Details:\n");
      console.log(`  Category ID: ${apparelCategory.id}`);
      console.log(`  Category Name: ${apparelCategory.name}`);
      console.log(`  Category Slug: ${apparelCategory.slug}`);
      console.log(`  Total Products: ${apparelCategory.products.length}`);

      if (apparelCategory.products.length > 0) {
        console.log("\n  Products in Apparel:");
        apparelCategory.products.forEach((product, index) => {
          const verified = product.seller?.verified ? "✅ Verified" : "❌ Unverified";
          console.log(
            `    ${index + 1}. ${product.name} - Seller: ${product.seller?.storeName} (${verified})`
          );
        });

        const verifiedCount = apparelCategory.products.filter(
          (p) => p.seller?.verified === true
        ).length;
        console.log(
          `\n  ⚠️  Only ${verifiedCount} out of ${apparelCategory.products.length} products will show on /apparel page`
        );
        console.log("     (Category page only shows products from verified sellers)");
      } else {
        console.log("\n  ❌ No products found in Apparel category!");
        console.log("     Check if products have categoryId set to Apparel category ID");
      }
    } else {
      console.log("❌ Apparel category not found!");
    }

    // 5. Check sellers
    console.log("\n👥 Seller Status:\n");
    const sellers = await prisma.sellerProfile.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    sellers.forEach((seller) => {
      const status = seller.verified ? "✅ Verified" : "❌ Unverified";
      console.log(
        `  ${seller.storeName.padEnd(30)} ${status.padEnd(15)} ${seller._count.products} products`
      );
      console.log(`    User: ${seller.user.email}`);
    });

    // 6. Products without category
    const productsWithoutCategory = allProducts.filter(
      (p) => !p.categoryId
    );
    if (productsWithoutCategory.length > 0) {
      console.log(
        `\n⚠️  Warning: ${productsWithoutCategory.length} product(s) without category:`
      );
      productsWithoutCategory.forEach((p) => {
        console.log(`    - ${p.name} (ID: ${p.id})`);
      });
    }

    // 7. Products from unverified sellers
    const unverifiedProducts = allProducts.filter(
      (p) => !p.seller?.verified
    );
    if (unverifiedProducts.length > 0) {
      console.log(
        `\n⚠️  Warning: ${unverifiedProducts.length} product(s) from unverified sellers (won't show on category pages):`
      );
      unverifiedProducts.forEach((p) => {
        console.log(
          `    - ${p.name} - Seller: ${p.seller?.storeName} - Category: ${p.category?.name || "None"}`
        );
      });
    }
  } catch (error: any) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugProducts();


