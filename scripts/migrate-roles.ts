/**
 * Migration script to update existing users from USER/ADMIN to BUYER/SELLER
 * Run with: npx tsx scripts/migrate-roles.ts
 */

import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";

config();

const prisma = new PrismaClient();

async function migrateRoles() {
  console.log("🔄 Migrating user roles...");

  try {
    // Update USER to BUYER
    const userResult = await prisma.$executeRaw`
      UPDATE "User" 
      SET role = 'BUYER' 
      WHERE role = 'USER'
    `;
    console.log(`✅ Updated ${userResult} users from USER to BUYER`);

    // Update ADMIN to SELLER
    const adminResult = await prisma.$executeRaw`
      UPDATE "User" 
      SET role = 'SELLER' 
      WHERE role = 'ADMIN'
    `;
    console.log(`✅ Updated ${adminResult} users from ADMIN to SELLER`);

    console.log("🎉 Migration completed!");
  } catch (error: any) {
    console.error("❌ Migration error:", error.message);
    if (error.message.includes("enum") || error.message.includes("Role")) {
      console.error("\n💡 The database enum might not be updated yet.");
      console.error("   Try running: npx prisma db push --accept-data-loss");
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateRoles();









