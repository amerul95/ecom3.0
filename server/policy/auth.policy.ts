import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthorizationError } from "@/lib/errors";
import { Role } from "@prisma/client";
import type { Session } from "next-auth";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

/**
 * Get current authenticated user
 * @returns AuthUser or null if not authenticated
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions) as Session | null;
  if (!session?.user) return null;

  return {
    id: session.user.id!,
    email: session.user.email!,
    role: (session.user as { role?: string }).role as Role || Role.BUYER,
  };
}

/**
 * Require authentication - throws if not authenticated
 * @returns AuthUser
 * @throws AuthorizationError if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthorizationError("You must be logged in");
  }
  return user;
}

/**
 * Require buyer role (or admin)
 * @returns AuthUser with BUYER or ADMIN role
 * @throws AuthorizationError if not authenticated or wrong role
 */
export async function requireBuyer(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role === Role.ADMIN) {
    return user;
  }
  if (user.role !== Role.BUYER) {
    throw new AuthorizationError("This action requires buyer access");
  }
  return user;
}

/**
 * Require admin role
 * @returns AuthUser with ADMIN role
 * @throws AuthorizationError if not authenticated or not admin
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role !== Role.ADMIN) {
    throw new AuthorizationError("This action requires admin access");
  }
  return user;
}

/**
 * Require specific role(s)
 * @param roles - Single role or array of roles
 * @returns AuthUser with matching role
 * @throws AuthorizationError if not authenticated or wrong role
 */
export async function requireRole(roles: Role | Role[]): Promise<AuthUser> {
  const user = await requireAuth();
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  if (!allowedRoles.includes(user.role)) {
    throw new AuthorizationError(`Forbidden: Required role(s): ${allowedRoles.join(", ")}`);
  }
  return user;
}
