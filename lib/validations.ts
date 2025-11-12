import { z } from "zod";

export const itemSchema = z.object({
  title: z.string().min(3).max(80),
  type: z.enum(["DRINKWARE", "APPAREL", "ACCESSORY", "OTHER"]),
  price: z.number().nonnegative().or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number)),
  colors: z.array(z.string()).optional().default([]),
  images: z.array(z.string()).optional().default([]),
});

export const itemUpdateSchema = itemSchema.partial();

export const itemIdSchema = z.object({
  id: z.string().cuid(),
});

export const uploadSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().regex(/^image\//),
});

// Product schemas (matching Prisma Product model)
export const productSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().min(10),
  price: z.number().positive().or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number)),
  stock: z.number().int().nonnegative(),
  categoryId: z.string().cuid().optional().nullable(),
  images: z.array(z.string()).min(1, "At least one image is required"),
  variants: z.array(z.object({
    name: z.string().min(1),
    sku: z.string().min(1),
    price: z.number().positive().optional().nullable(),
    stock: z.number().int().nonnegative(),
  })).optional().default([]),
});

export const productUpdateSchema = productSchema.partial();



