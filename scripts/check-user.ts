/**
 * Script to check if a user exists in the database
 * Usage: tsx scripts/check-user.ts <email>
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkUser(email: string) {
  try {
    console.log(`🔍 Checking for user: ${email}\n`);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        sellerProfile: {
          include: {
            _count: {
              select: {
                products: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      console.log(`❌ User with email "${email}" does NOT exist in the database.`);
      return;
    }

    console.log("✅ User found!\n");
    console.log("┌─────────────────────────────────────────────────────────┐");
    console.log("│ User Details                                           │");
    console.log("├─────────────────────────────────────────────────────────┤");
    console.log(`│ ID:        ${user.id.padEnd(45)} │`);
    console.log(`│ Email:     ${user.email.padEnd(45)} │`);
    console.log(`│ Name:      ${(user.name || "N/A").padEnd(45)} │`);
    console.log(`│ Role:      ${user.role.padEnd(45)} │`);
    console.log(`│ Created:   ${user.createdAt.toISOString().padEnd(45)} │`);
    console.log("└─────────────────────────────────────────────────────────┘\n");

    if (user.sellerProfile) {
      console.log("┌─────────────────────────────────────────────────────────┐");
      console.log("│ Seller Profile                                        │");
      console.log("├─────────────────────────────────────────────────────────┤");
      console.log(`│ Profile ID:  ${user.sellerProfile.id.padEnd(42)} │`);
      console.log(`│ Store Name:  ${user.sellerProfile.storeName.padEnd(42)} │`);
      console.log(`│ Verified:    ${(user.sellerProfile.verified ? "✅ Yes" : "❌ No").padEnd(42)} │`);
      console.log(`│ Products:    ${user.sellerProfile._count.products.toString().padEnd(42)} │`);
      console.log("└─────────────────────────────────────────────────────────┘\n");

      if (user.sellerProfile._count.products > 0) {
        const products = await prisma.product.findMany({
          where: { sellerId: user.sellerProfile.id },
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            stock: true,
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        });

        console.log("📦 Products:\n");
        products.forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.name}`);
          console.log(`     - Slug: ${product.slug}`);
          console.log(`     - Price: S$ ${product.price}`);
          console.log(`     - Stock: ${product.stock}`);
          console.log(`     - Category: ${product.category?.name || "None"} (${product.category?.slug || "N/A"})`);
          console.log("");
        });
      }
    } else {
      console.log("⚠️  This user does NOT have a seller profile.\n");
    }

    // List all users for reference
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`\n📊 Total users in database: ${allUsers.length}`);
    console.log("\nAll users:");
    allUsers.forEach((u, index) => {
      const marker = u.email === email ? "👉" : "  ";
      console.log(`${marker} ${index + 1}. ${u.email} (${u.role})`);
    });
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2] || "seller2@gmail.com";
checkUser(email);

