import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
});

// POST /api/auth/register-seller - Register new seller
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);

    // Check if user with this email already exists (unified User model)
    const existingUser = await prisma.user.findUnique({
      where: { 
        email: validated.email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Account with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // Create user with SELLER role and seller profile
    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        password: hashedPassword,
        role: Role.SELLER,
        emailVerified: new Date(),
        sellerProfile: {
          create: {
            storeName: `${validated.name}'s Store`,
            verified: false, // Requires admin approval
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json(
      {
        message: "Seller account created successfully",
        user: {
          ...user,
          role: "SELLER" as const,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Registration error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error.message || "Failed to create seller account",
      },
      { status: 500 }
    );
  }
}

