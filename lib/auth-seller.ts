/**
 * Seller-specific authentication
 * NOTE: This file is deprecated. Seller authentication is now handled through
 * the unified User model with Role.SELLER. Use lib/auth.ts instead.
 * 
 * @deprecated Use NextAuth with Role.SELLER instead
 */

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Role } from "@prisma/client";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * @deprecated Use NextAuth authentication instead
 */
export async function authenticateSeller(email: string, password: string) {
  try {
    const validated = loginSchema.parse({ email, password });

    // Find user by email with SELLER role
    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (!user || !user.password || user.role !== Role.SELLER) {
      return null;
    }

    const isValid = await bcrypt.compare(validated.password, user.password);
    if (!isValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: "SELLER" as const,
      image: user.image,
    };
  } catch (error) {
    console.error("Seller auth error:", error);
    return null;
  }
}









