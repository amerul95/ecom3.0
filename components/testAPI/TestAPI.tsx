'use client';

import React, { useEffect, useState } from 'react';

interface ApiProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category?: { slug: string; name: string } | null;
}

interface ProductsResponse {
  products: ApiProduct[];
}

export const TestAPI: React.FC = () => {
  const [products, setProducts] = useState<ApiProduct[]>([]);

  useEffect(() => {
    fetch('/api/products?limit=20')
      .then((response) => response.json())
      .then((data: ProductsResponse) => setProducts(data.products ?? []))
      .catch(() => {});
  }, []);

  return (
    <div>
      <h1>Products</h1>
      <ul>
        {products.map((product) => (
          <li className="border m-5 p-5" key={product.id}>
            <h2>{product.name}</h2>
            <p>Price: RM {product.price}</p>
            <p>Description: {product.description}</p>
            <p>Category: {product.category?.name ?? 'N/A'}</p>
            <div>
              {product.images?.length ? (
                product.images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`${product.name} ${index + 1}`}
                    className="max-w-24 h-auto mr-2"
                  />
                ))
              ) : (
                <p>No images available</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

