'use server';

import { getProducts } from '@/server/dal/product.dal';
import type { ProductListResponse } from '@/server/dto/product.dto';

export async function searchProducts(
  categoryId: string | undefined,
  searchTerm: string
): Promise<ProductListResponse> {
  return await getProducts({
    categoryId,
    search: searchTerm || undefined,
  });
}
