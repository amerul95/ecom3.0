import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  
  return {
    id: session.user.id!,
    email: session.user.email!,
    role: session.user.role! as Role,
  };
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

/**
 * Require a specific role or one of multiple roles
 * @param roles - Single role or array of allowed roles
 * @returns AuthUser if authorized
 * @throws Error if unauthorized
 */
export async function requireRole(roles: Role | Role[]): Promise<AuthUser> {
  const user = await requireAuth();
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Forbidden: Required role(s): ${allowedRoles.join(", ")}`);
  }
  return user;
}

export async function requireSeller(): Promise<AuthUser> {
  return requireRole(Role.SELLER);
}

export async function requireAdmin(): Promise<AuthUser> {
  return requireRole(Role.ADMIN);
}

export async function requireBuyer(): Promise<AuthUser> {
  return requireRole(Role.BUYER);
}

/**
 * Check if user can manage a product (seller owns it or is admin)
 */
export async function canManageProduct(productId: string, userId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  
  // Admins can manage any product
  if (user.role === Role.ADMIN) return true;
  
  // Sellers can manage their own products
  if (user.role === Role.SELLER) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { sellerId: true, seller: { select: { userId: true } } },
    });
    return product?.seller.userId === userId;
  }
  return false;
}

/**
 * Check if user can manage an item (user owns it or is admin)
 * NOTE: Item model has been deprecated. This function always returns false.
 * @deprecated Use canManageProduct instead
 */
export async function canManageItem(itemId: string, userId: string): Promise<boolean> {
  // Item model has been replaced with Product model
  // This function is kept for backwards compatibility but always returns false
  return false;
}

