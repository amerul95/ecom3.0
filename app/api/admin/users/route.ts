import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/policy/auth.policy";

export async function GET() {
  try {
    await requireAdmin();

    // Fetch all users with their order count and roles
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc', // Latest to oldest
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true, // Primary role for backward compatibility
        roles: {
          select: {
            role: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    const formattedUsers = users.map((user, index) => {
      // Get all roles: primary role + roles from UserRole table
      const allRoles = [
        user.role,
        ...user.roles.map((ur) => ur.role),
      ];
      // Remove duplicates and sort (ADMIN first)
      const uniqueRoles = Array.from(new Set(allRoles)).sort((a, b) => 
        a === 'ADMIN' ? -1 : b === 'ADMIN' ? 1 : 0
      );

      return {
        no: index + 1,
        userId: user.id,
        name: user.name || 'Not set',
        email: user.email,
        role: user.role, // Primary role for backward compatibility
        roles: uniqueRoles, // All roles including multiple
        ordersCount: user._count.orders,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    });

    return NextResponse.json({ users: formattedUsers });
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: error.status || 500 }
    );
  }
}
