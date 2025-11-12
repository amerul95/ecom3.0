/**
 * Script to reset a user's password
 * Usage: tsx scripts/reset-password.ts <email> <new-password>
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function resetPassword(email: string, newPassword: string) {
  try {
    if (newPassword.length < 6) {
      console.log("❌ Password must be at least 6 characters long");
      return;
    }

    console.log(`🔐 Resetting password for: ${email}\n`);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`❌ User with email "${email}" does NOT exist.`);
      return;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    console.log(`✅ Password reset successfully for ${email}!`);
    console.log(`   New password: ${newPassword}`);
    console.log(`\n💡 You can now log in with this password.`);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.log("Usage: tsx scripts/reset-password.ts <email> <new-password>");
  console.log("Example: tsx scripts/reset-password.ts seller2@gmail.com mynewpassword123");
  process.exit(1);
}

resetPassword(email, newPassword);


