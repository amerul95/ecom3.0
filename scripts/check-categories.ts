/**
 * Check categories in database and list available slugs
 * Run with: tsx scripts/check-categories.ts
 */

import { PrismaClient } from "@prisma/client";
import { ensureDefaultCategories, DEFAULT_CATEGORIES } from "../lib/default-categories";

const prisma = new PrismaClient();

async function checkCategories() {
  console.log("🔍 Checking categories in database...\n");

  try {
    await ensureDefaultCategories();
    console.log("✅ Ensured default categories exist:");
    DEFAULT_CATEGORIES.forEach((category) => {
      console.log(`   - ${category.name} (${category.slug})`);
    });
    console.log("");

    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    if (categories.length === 0) {
      console.log("❌ No categories found in database!");
      console.log("\n💡 You need to create categories first.");
      console.log("   You can:");
      console.log("   1. Use Prisma Studio: npm run db:studio");
      console.log("   2. Create categories via API: POST /api/categories");
      console.log("   3. Seed database: npm run db:seed");
      return;
    }

    console.log(`✅ Found ${categories.length} categories:\n`);
    console.log("┌─────────────────────────────────────────────────────────┐");
    console.log("│ Category List                                           │");
    console.log("├─────────────────────────────────────────────────────────┤");

    categories.forEach((cat, index) => {
      const productCount = cat._count.products;
      const hasParent = cat.parentId ? " (Child)" : " (Root)";
      console.log(
        `│ ${(index + 1).toString().padStart(2)}. ${cat.name.padEnd(25)} │ ${cat.slug.padEnd(20)} │ ${productCount.toString().padStart(3)} products${hasParent.padEnd(8)} │`
      );
    });

    console.log("└─────────────────────────────────────────────────────────┘");

    console.log("\n📋 Available category slugs:");
    categories.forEach((cat) => {
      console.log(`   - ${cat.slug} (${cat.name})`);
    });

    // Check for products
    const totalProducts = await prisma.product.count();
    const productsWithVerifiedSellers = await prisma.product.count({
      where: {
        seller: {
          verified: true,
        },
      },
    });

    console.log("\n📊 Product Statistics:");
    console.log(`   Total products: ${totalProducts}`);
    console.log(`   Products from verified sellers: ${productsWithVerifiedSellers}`);
    console.log(
      `   Products from unverified sellers: ${totalProducts - productsWithVerifiedSellers}`
    );

    if (productsWithVerifiedSellers === 0 && totalProducts > 0) {
      console.log(
        "\n⚠️  Warning: You have products but no verified sellers!"
      );
      console.log("   Products will not show up in category pages.");
      console.log("   Verify sellers in the database or update the API filter.");
    }

    // Check sellers
    const sellers = await prisma.sellerProfile.findMany({
      select: {
        id: true,
        storeName: true,
        verified: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    console.log("\n👥 Seller Statistics:");
    sellers.forEach((seller) => {
      const status = seller.verified ? "✅ Verified" : "❌ Unverified";
      console.log(
        `   ${seller.storeName.padEnd(30)} ${status.padEnd(12)} ${seller._count.products} products`
      );
    });

    const verifiedSellers = sellers.filter((s) => s.verified).length;
    if (verifiedSellers === 0) {
      console.log(
        "\n⚠️  Warning: No verified sellers found!"
      );
      console.log("   Products will not show up until sellers are verified.");
    }
  } catch (error: any) {
    console.error("❌ Error checking categories:", error);
    if (error.code === "P2001" || error.message?.includes("does not exist")) {
      console.error(
        "\n💡 Database schema issue. Run: npm run db:push"
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkCategories();

