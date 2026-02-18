import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { z } from "zod";

const updateUserRolesSchema = z.object({
  roles: z.array(z.enum(['ADMIN', 'BUYER'])).min(1, 'User must have at least one role'),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin();
    const { userId } = await params;
    const body = await request.json();
    const { roles } = updateUserRolesSchema.parse(body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove all existing roles
    await prisma.userRole.deleteMany({
      where: { userId },
    });

    // Add new roles
    await prisma.userRole.createMany({
      data: roles.map((role) => ({
        userId,
        role,
      })),
    });

    // Update primary role to the first role (for backward compatibility)
    await prisma.user.update({
      where: { id: userId },
      data: {
        role: roles[0],
      },
    });

    return NextResponse.json({ success: true, roles });
  } catch (error: any) {
    console.error('Failed to update user roles:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update user roles' },
      { status: error.status || 500 }
    );
  }
}
