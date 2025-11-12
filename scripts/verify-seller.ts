/**
 * Script to verify a seller account
 * Usage: tsx scripts/verify-seller.ts <seller-email>
 * Example: tsx scripts/verify-seller.ts seller@gmail.com
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifySeller(email?: string) {
  try {
    if (!email) {
      // List all sellers
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

      console.log("👥 All Sellers:\n");
      sellers.forEach((seller, index) => {
        const status = seller.verified ? "✅ Verified" : "❌ Unverified";
        console.log(
          `${index + 1}. ${seller.storeName.padEnd(30)} ${status.padEnd(15)} ${seller._count.products} products`
        );
        console.log(`   Email: ${seller.user.email}`);
        console.log(`   User ID: ${seller.userId}`);
        console.log(`   Seller Profile ID: ${seller.id}`);
        console.log("");
      });

      console.log("\n💡 To verify a seller, run:");
      console.log("   tsx scripts/verify-seller.ts <seller-email>");
      return;
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        sellerProfile: true,
      },
    });

    if (!user) {
      console.log(`❌ User with email "${email}" not found`);
      return;
    }

    if (!user.sellerProfile) {
      console.log(`❌ User "${email}" does not have a seller profile`);
      return;
    }

    // Verify seller
    await prisma.sellerProfile.update({
      where: { id: user.sellerProfile.id },
      data: { verified: true },
    });

    console.log(`✅ Seller "${user.sellerProfile.storeName}" (${email}) has been verified!`);
    console.log(`   Products will now appear on category pages.`);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];
verifySeller(email);
