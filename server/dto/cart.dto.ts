import { z } from "zod";

// Add to Cart Schema
export const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().optional(),
  quantity: z.number().int().positive().max(100, "Quantity cannot exceed 100").default(1),
});

// Update Cart Item Schema
export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive().max(100, "Quantity cannot exceed 100"),
});

// Delete Cart Item Schema
export const deleteCartItemSchema = z.object({
  id: z.string().min(1, "Cart item ID is required"),
});

// Response Schemas
export const cartItemResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  productId: z.string(),
  variantId: z.string().nullable(),
  quantity: z.number(),
  addedAt: z.date(),
});

export const cartResponseSchema = z.object({
  items: z.array(cartItemResponseSchema),
  total: z.string(),
  itemCount: z.number(),
});

export const successResponseSchema = z.object({
  success: z.boolean(),
});

// Type Exports
export type AddToCartRequest = z.infer<typeof addToCartSchema>;
export type UpdateCartItemRequest = z.infer<typeof updateCartItemSchema>;
export type DeleteCartItemRequest = z.infer<typeof deleteCartItemSchema>;
export type CartResponse = z.infer<typeof cartResponseSchema>;
export type SuccessResponse = z.infer<typeof successResponseSchema>;