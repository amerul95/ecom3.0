import { PAGINATION_DEFAULTS } from "@/types";
import { z } from "zod";

export const productQuerySchema = z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : PAGINATION_DEFAULTS.page)),
    limit: z.string().optional().transform((val) => {
      const parsed = val ? parseInt(val, 10) : PAGINATION_DEFAULTS.limit;
      return Math.min(parsed, PAGINATION_DEFAULTS.maxLimit);
    }),
    categoryId: z.string().optional(),
    minPrice: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
    maxPrice: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
    search: z.string().optional(),
    sortBy: z.enum(["name", "price", "createdAt", "updatedAt"]).optional().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  });

const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  parentId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const productResponseSchema = z.object({
  products: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      price: z.number(),
      stock: z.number(),
      slug: z.string(),
      images: z.array(z.string()),
      categoryId: z.string().nullable(),
      category: categorySchema.nullable(),
      createdAt: z.date(),
      updatedAt: z.date(),
      status: z.string(),
      averageRating: z.number(),
      reviewCount: z.number(),
    })
  ),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    pages: z.number(),
  }),
});

// Product creation/update schemas
export const productSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().min(10),
  price: z.number().positive().or(z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number)),
  stock: z.number().int().nonnegative(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE"),
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

export type ProductQuery = z.infer<typeof productQuerySchema>;
export type ProductListResponse = z.infer<typeof productResponseSchema>;
export type ProductCreateRequest = z.infer<typeof productSchema>;
export type ProductUpdateRequest = z.infer<typeof productUpdateSchema>;

