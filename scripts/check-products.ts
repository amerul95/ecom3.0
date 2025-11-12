import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log("📄 Loaded .env file\n");
}

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking products in database...\n");

  // Get all products
  const allProducts = await prisma.product.findMany({
    include: {
      category: true,
      seller: {
        include: {
          user: {
            select: {
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
    return;
  }

  // Display all products
  console.log("=".repeat(80));
  console.log("ALL PRODUCTS:");
  console.log("=".repeat(80));
  allProducts.forEach((product, index) => {
    console.log(`\n${index + 1}. Product ID: ${product.id}`);
    console.log(`   Name: ${product.name}`);
    console.log(`   Slug: ${product.slug}`);
    console.log(`   Category: ${product.category?.name || "NULL"} (ID: ${product.categoryId || "NULL"})`);
    console.log(`   Category Slug: ${product.category?.slug || "NULL"}`);
    console.log(`   Seller: ${product.seller?.user?.name || "NULL"} (${product.seller?.user?.email || "NULL"})`);
    console.log(`   Seller Verified: ${product.seller?.verified ? "✅ YES" : "❌ NO"}`);
    console.log(`   Price: ${product.price}`);
    console.log(`   Stock: ${product.stock}`);
    console.log(`   Images: ${product.images?.length || 0} image(s)`);
    console.log(`   Created: ${product.createdAt}`);
  });

  // Check apparel category specifically
  console.log("\n" + "=".repeat(80));
  console.log("CHECKING APPAREL CATEGORY:");
  console.log("=".repeat(80));

  const apparelCategory = await prisma.category.findFirst({
    where: {
      OR: [
        { slug: "apparel" },
        { name: { contains: "apparel", mode: "insensitive" } },
        { name: { contains: "clothing", mode: "insensitive" } },
      ],
    },
    include: {
      products: {
        include: {
          seller: {
            include: {
              user: {
                select: {
                  email: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (apparelCategory) {
    console.log(`\n✅ Found category: ${apparelCategory.name} (slug: ${apparelCategory.slug})`);
    console.log(`   Category ID: ${apparelCategory.id}`);
    console.log(`   Total products in this category: ${apparelCategory.products.length}`);

    if (apparelCategory.products.length > 0) {
      console.log("\n   Products in this category:");
      apparelCategory.products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} (ID: ${product.id})`);
        console.log(`      Seller Verified: ${product.seller?.verified ? "✅ YES" : "❌ NO"}`);
      });

      // Check verified sellers
      const verifiedProducts = apparelCategory.products.filter(
        (p) => p.seller?.verified === true
      );
      console.log(`\n   ✅ Verified seller products: ${verifiedProducts.length}`);
      console.log(`   ❌ Unverified seller products: ${apparelCategory.products.length - verifiedProducts.length}`);
    } else {
      console.log("\n   ⚠️  No products assigned to this category!");
    }
  } else {
    console.log("\n❌ Apparel category not found!");
    console.log("\n   Available categories:");
    const allCategories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
    allCategories.forEach((cat) => {
      console.log(`   - ${cat.name} (slug: ${cat.slug}) - ${cat._count.products} products`);
    });
  }

  // Check all categories
  console.log("\n" + "=".repeat(80));
  console.log("ALL CATEGORIES:");
  console.log("=".repeat(80));
  const allCategories = await prisma.category.findMany({
    include: {
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

  allCategories.forEach((cat) => {
    console.log(`\n${cat.name} (slug: ${cat.slug})`);
    console.log(`   ID: ${cat.id}`);
    console.log(`   Products: ${cat._count.products}`);
  });

  // Check seller profiles
  console.log("\n" + "=".repeat(80));
  console.log("SELLER PROFILES:");
  console.log("=".repeat(80));
  const sellerProfiles = await prisma.sellerProfile.findMany({
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

  sellerProfiles.forEach((seller) => {
    console.log(`\n${seller.user?.name || "Unknown"} (${seller.user?.email})`);
    console.log(`   Store: ${seller.storeName}`);
    console.log(`   Verified: ${seller.verified ? "✅ YES" : "❌ NO"}`);
    console.log(`   Products: ${seller._count.products}`);
  });
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });








