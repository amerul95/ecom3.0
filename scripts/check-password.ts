/**
 * Script to check if a user has a password set and verify it
 * Usage: tsx scripts/check-password.ts <email> [password-to-test]
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function checkPassword(email: string, testPassword?: string) {
  try {
    console.log(`🔍 Checking password for user: ${email}\n`);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
      },
    });

    if (!user) {
      console.log(`❌ User with email "${email}" does NOT exist.`);
      return;
    }

    console.log("✅ User found!\n");
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name || "N/A"}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Has Password: ${user.password ? "✅ Yes" : "❌ No"}\n`);

    if (!user.password) {
      console.log("⚠️  WARNING: This user does NOT have a password set!");
      console.log("   This is why login is failing.");
      console.log("\n💡 Solutions:");
      console.log("   1. Reset the password using the signup page");
      console.log("   2. Or set a password manually using a script");
      return;
    }

    if (testPassword) {
      console.log(`🔐 Testing password: "${testPassword}"\n`);
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log(`  Password Match: ${isValid ? "✅ YES" : "❌ NO"}`);
      
      if (!isValid) {
        console.log("\n⚠️  The password you tested does NOT match!");
        console.log("   This is why login is failing.");
      } else {
        console.log("\n✅ The password matches! Login should work.");
      }
    } else {
      console.log("💡 To test a password, run:");
      console.log(`   tsx scripts/check-password.ts ${email} <password>`);
    }

    // Show password hash (first 20 chars for debugging)
    if (user.password) {
      console.log(`\n  Password Hash (first 20 chars): ${user.password.substring(0, 20)}...`);
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];
const testPassword = process.argv[3];

if (!email) {
  console.log("Usage: tsx scripts/check-password.ts <email> [password-to-test]");
  process.exit(1);
}

checkPassword(email, testPassword);


