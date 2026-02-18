import { requireAuth, requireBuyer, type AuthUser } from "./auth.policy";
import { AuthorizationError, NotFoundError } from "@/lib/errors";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Re-export for convenience
export { requireBuyer };
export type { AuthUser };

/**
 * Verify that the current user can access/modify a cart item by ID
 * @param cartItemId - The cart item ID to check
 * @returns The cart item's userId
 * @throws NotFoundError if cart item doesn't exist
 * @throws AuthorizationError if user is not authorized
 */
export async function canAccessCartItem(cartItemId: string): Promise<string> {
  const user = await requireAuth();

  // Get cart item to check ownership
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    select: { userId: true },
  });

  if (!cartItem) {
    throw new NotFoundError("Cart item", cartItemId);
  }

  // Allow access if user owns the cart item OR is an admin
  if (user.id !== cartItem.userId && user.role !== Role.ADMIN) {
    throw new AuthorizationError("You do not have permission to access this cart item");
  }

  return cartItem.userId;
}
