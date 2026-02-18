export interface Category {
  id: string;
  name: string;
  slug: string;
}

export type ProductStatus = 'ACTIVE' | 'INACTIVE';

export interface ProductResponse {
  product: {
    id: string;
    name: string;
    description: string;
    price: string | number | { toString: () => string };
    stock: number;
    status?: ProductStatus;
    categoryId: string | null;
    images: string[];
    variants: Array<{
      id: string;
      name: string;
      sku: string;
      price: string | number | { toString: () => string } | null;
      stock: number;
    }>;
  };
}
