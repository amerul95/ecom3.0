import { z } from 'zod';

export const priceStringSchema = z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format');
export const stockStringSchema = z.string().regex(/^\d+$/, 'Stock must be a number');

export const productFormSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(255, 'Name is too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: priceStringSchema,
  stock: stockStringSchema,
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  categoryId: z.string().optional(),
  images: z
    .array(z.string())
    .min(1, 'At least one image (main image) is required')
    .max(4, 'Maximum 4 images allowed'),
  variants: z.array(
    z.object({
      name: z.string().min(1, 'Variant name is required'),
      sku: z.string().min(1, 'SKU is required'),
      price: z
        .union([priceStringSchema, z.literal('')])
        .optional()
        .nullable(),
      stock: stockStringSchema,
    })
  ),
});

export type ProductFormData = z.infer<typeof productFormSchema>;
