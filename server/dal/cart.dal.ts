import { prisma } from "@/lib/prisma";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { AddToCartRequest, UpdateCartItemRequest } from "../dto/cart.dto";

/**
 * Get user's cart with all items
 * @param userId - User ID
 * @returns Cart items with product and variant details
 */
export async function getCart(userId: string) {
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          category: true,
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
              storeName: true,
            },
          },
        },
      },
      variant: true,
    },
    orderBy: { addedAt: "desc" },
  });

  const total = cartItems.reduce((sum, item) => {
    const price = item.variant?.price 
      ? Number(item.variant.price) 
      : Number(item.product.price);
    return sum + price * item.quantity;
  }, 0);

  return {
    items: cartItems,
    total: total.toFixed(2),
    itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
  };
}

/**
 * Add item to cart or update quantity if item already exists
 * @param userId - User ID
 * @param data - Cart item data
 * @returns Created or updated cart item
 * @throws NotFoundError if product/variant doesn't exist
 * @throws ValidationError if insufficient stock
 */
export async function addToCart(userId: string, data: AddToCartRequest) {
  // Check if product exists and has stock
  const product = await prisma.product.findUnique({
    where: { id: data.productId },
    include: {
      variants: data.variantId ? { where: { id: data.variantId } } : false,
    },
  });

  if (!product) {
    throw new NotFoundError("Product", data.productId);
  }

  // Check variant if provided
  if (data.variantId) {
    const variant = product.variants?.find((v) => v.id === data.variantId);
    if (!variant) {
      throw new NotFoundError("Variant", data.variantId);
    }
    if (variant.stock < data.quantity) {
      throw new ValidationError(
        `Insufficient stock for variant. Available: ${variant.stock}, Requested: ${data.quantity}`
      );
    }
  } else {
    if (product.stock < data.quantity) {
      throw new ValidationError(
        `Insufficient stock. Available: ${product.stock}, Requested: ${data.quantity}`
      );
    }
  }

  // Check if item already in cart
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      userId,
      productId: data.productId,
      variantId: data.variantId ?? null,
    },
  });

  if (existingItem) {
    // Update quantity
    const newQuantity = existingItem.quantity + data.quantity;
    return await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQuantity },
      include: {
        product: true,
        variant: true,
      },
    });
  } else {
    // Create new cart item
    return await prisma.cartItem.create({
      data: {
        userId,
        productId: data.productId,
        variantId: data.variantId || null,
        quantity: data.quantity,
      },
      include: {
        product: true,
        variant: true,
      },
    });
  }
}

/**
 * Update cart item quantity
 * @param id - Cart item ID
 * @param data - Update data
 * @returns Updated cart item
 * @throws NotFoundError if cart item doesn't exist
 * @throws ValidationError if insufficient stock
 */
export async function updateCartItem(id: string, data: UpdateCartItemRequest) {
  const cartItem = await prisma.cartItem.findUnique({
    where: { id },
    include: {
      product: true,
      variant: true,
    },
  });

  if (!cartItem) {
    throw new NotFoundError("Cart item", id);
  }

  // Check stock availability
  const availableStock = cartItem.variant
    ? cartItem.variant.stock
    : cartItem.product.stock;

  if (data.quantity > availableStock) {
    throw new ValidationError(
      `Insufficient stock. Available: ${availableStock}, Requested: ${data.quantity}`
    );
  }

  // Update quantity
  return await prisma.cartItem.update({
    where: { id },
    data: { quantity: data.quantity },
    include: {
      product: true,
      variant: true,
    },
  });
}

/**
 * Delete a cart item by ID
 * @param id - Cart item ID
 * @throws NotFoundError if cart item doesn't exist
 */
export async function deleteCartItem(id: string): Promise<void> {
  const cartItem = await prisma.cartItem.findUnique({
    where: { id },
  });

  if (!cartItem) {
    throw new NotFoundError("Cart item", id);
  }

  await prisma.cartItem.delete({
    where: { id },
  });
}