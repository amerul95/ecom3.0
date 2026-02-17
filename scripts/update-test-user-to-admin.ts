import { config } from "dotenv";
import { PrismaClient, Role } from "@prisma/client";

config();

const prisma = new PrismaClient();

async function updateTestUser() {
  try {
    const email = "test@test.com";
    
    console.log(`🔄 Updating user: ${email}\n`);
    
    // Update user to ADMIN role
    const user = await prisma.user.update({
      where: { email },
      data: {
        role: Role.ADMIN,
      },
    });

    console.log("✅ User updated successfully!");
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Role: ${user.role}`);
    console.log("\n📊 New Access:");
    console.log("  - Buyer Access: ✅ Yes (Admin can access buyer features)");
    console.log("  - Seller Access: ✅ Yes (Admin can access seller features)");
    console.log("  - Admin Access: ✅ Yes");
    console.log("\n💡 Note: Admin role will need authorization updates to access seller/buyer APIs.");

  } catch (error: any) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateTestUser();
