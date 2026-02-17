import { config } from "dotenv";
import { PrismaClient, Role } from "@prisma/client";

config();

const prisma = new PrismaClient();

async function checkUserRole() {
  try {
    const email = "test@test.com";
    
    console.log(`🔍 Checking user: ${email}\n`);
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        sellerProfile: true,
      },
    });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return;
    }

    console.log("Current User Details:");
    console.log(`  - ID: ${user.id}`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Name: ${user.name || "N/A"}`);
    console.log(`  - Role: ${user.role}`);
    console.log(`  - Has Seller Profile: ${user.sellerProfile ? "Yes" : "No"}`);
    
    if (user.sellerProfile) {
      console.log(`  - Store Name: ${user.sellerProfile.storeName}`);
      console.log(`  - Verified: ${user.sellerProfile.verified}`);
    }

    console.log("\n📊 Access Analysis:");
    console.log(`  - Buyer Access: ${user.role === Role.BUYER || user.role === Role.ADMIN ? "✅ Yes" : "❌ No"}`);
    console.log(`  - Seller Access: ${user.role === Role.SELLER || user.role === Role.ADMIN ? "✅ Yes" : "❌ No"}`);
    console.log(`  - Admin Access: ${user.role === Role.ADMIN ? "✅ Yes" : "❌ No"}`);

    console.log("\n💡 Note: Each user can only have ONE role at a time.");
    console.log("   To access multiple roles, you need ADMIN role or separate accounts.");

  } catch (error: any) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRole();
