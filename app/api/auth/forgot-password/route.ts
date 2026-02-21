import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";

const bodySchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = bodySchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "If an account exists with this email, you will receive a reset link." },
        { status: 200 }
      );
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.verificationToken.deleteMany({
      where: { identifier: email.toLowerCase().trim() },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: email.toLowerCase().trim(),
        token,
        expires,
      },
    });

    const baseUrl = request.nextUrl.origin;
    const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({
        message: "If an account exists with this email, you will receive a reset link.",
        resetLink,
      });
    }

    return NextResponse.json({
      message: "If an account exists with this email, you will receive a reset link.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
