'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number | string | { toString: () => string };
  stock: number;
  images: string[];
  category: {
    name: string;
  } | null;
  _count: {
    reviews: number;
    orderItems: number;
  };
}

function formatPrice(price: number | string | { toString: () => string }): string {
  if (typeof price === 'number') {
    return price.toFixed(2);
  }
  if (typeof price === 'string') {
    return parseFloat(price).toFixed(2);
  }
  return parseFloat(price.toString()).toFixed(2);
}

export default function AdminProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/login?error=unauthorized');
      return;
    }

    if (status === 'authenticated') {
      fetchProducts();
    }
  }, [status, session, router]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/admin/products');
      const productsData = response.data.products || [];
      
      setProducts(productsData);
      setStatusMessage(null);
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
      setStatusMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to load products. Please refresh the page.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string, productName: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${productName}"? This action cannot be undone.`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingId(productId);
      setStatusMessage(null);

      await axios.delete(`/api/admin/products/${productId}`);

      setProducts((prev) => prev.filter((product) => product.id !== productId));
      setStatusMessage({
        type: 'success',
        text: `"${productName}" has been deleted.`,
      });
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      setStatusMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to delete product. Please try again.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-lg text-foreground">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-lg text-foreground">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-7xl mx-auto p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Products</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage product listings</p>
            </div>
            <Link
              href="/admin/products/new"
              className="px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 font-medium"
            >
              Add New Product
            </Link>
          </div>

          {statusMessage && (
            <div
              className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
                statusMessage.type === 'success'
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200'
                  : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          {products.length === 0 ? (
            <div className="bg-card dark:bg-card border border-border rounded-lg shadow-sm p-12 text-center">
              <p className="text-muted-foreground mb-4">No products yet</p>
              <Link
                href="/admin/products/new"
                className="inline-block px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600"
              >
                Create Your First Product
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const firstImage = product.images && product.images.length > 0 ? product.images[0] : null;
                
                return (
                  <div key={product.id} className="bg-card dark:bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                    <div className="w-full h-48 bg-muted dark:bg-muted/50 flex items-center justify-center overflow-hidden">
                      {firstImage ? (
                        <img
                          src={firstImage}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            if (target.parentElement) {
                              target.parentElement.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center bg-gray-100">
                                  <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                  </svg>
                                </div>
                              `;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted/50 dark:bg-muted/30">
                          <svg className="w-16 h-16 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{product.name}</h3>
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                        S$ {formatPrice(product.price)}
                      </p>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <span>Stock: {product.stock}</span>
                        <span>{product.category?.name || 'Uncategorized'}</span>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="flex-1 px-4 py-2 bg-muted dark:bg-muted/80 text-foreground rounded-lg hover:bg-muted/80 dark:hover:bg-muted text-center text-sm"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          disabled={deletingId === product.id}
                          className="flex-1 px-4 py-2 bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {deletingId === product.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
}
