/**
 * Test helpers for API endpoints
 * These can be used for manual testing or integration tests
 */

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export async function createTestUser(email: string, role: "BUYER" | "SELLER" = "BUYER") {
  const password = await bcrypt.hash("test123", 10);
  return await prisma.user.create({
    data: {
      email,
      name: role === "SELLER" ? "Test Seller" : "Test Buyer",
      password,
      role: role === "SELLER" ? Role.SELLER : Role.BUYER,
      emailVerified: new Date(),
    },
  });
}

/**
 * @deprecated Item model has been replaced with Product model
 */
export async function createTestItem(ownerId: string, data?: Partial<{
  title: string;
  type: "DRINKWARE" | "APPAREL" | "ACCESSORY" | "OTHER";
  price: number;
  colors: string[];
  images: string[];
}>) {
  // Item model no longer exists - this function is deprecated
  throw new Error("Item model has been deprecated. Use Product model instead.");
}

export async function cleanupTestData() {
  // Item model no longer exists
  await prisma.user.deleteMany({
    where: {
      email: {
        endsWith: "@test.com",
      },
    },
  });
}

