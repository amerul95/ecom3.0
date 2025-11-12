'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number | string | { toString: () => string }; // Prisma Decimal can be number, string, or Decimal object
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

// Helper function to convert Prisma Decimal to number
function formatPrice(price: number | string | { toString: () => string }): string {
  if (typeof price === 'number') {
    return price.toFixed(2);
  }
  if (typeof price === 'string') {
    return parseFloat(price).toFixed(2);
  }
  // Prisma Decimal object
  return parseFloat(price.toString()).toFixed(2);
}

export default function SellerProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/seller/login');
      return;
    }
    if (status === 'authenticated' && session?.user?.role !== 'SELLER') {
      router.push('/seller/login?error=unauthorized');
      return;
    }

    if (status === 'authenticated') {
      fetchProducts();
    }
  }, [status, session, router]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/seller/products');
      const productsData = response.data.products || [];
      
      // Debug: Log products to see image data
      console.log('📦 Fetched products:', productsData.map((p: Product) => ({
        id: p.id,
        name: p.name,
        images: p.images,
        imageCount: Array.isArray(p.images) ? p.images.length : 0,
        firstImage: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : 'N/A',
      })));
      
      setProducts(productsData);
      setStatusMessage(null);
      
      // Show message if seller profile not found
      if (response.data.message) {
        console.warn(response.data.message);
      }
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      
      // Handle 404 specifically - might be unauthorized
      if (error.response?.status === 404 || error.response?.status === 401) {
        setProducts([]);
      }
      setStatusMessage({
        type: 'error',
        text:
          error.response?.data?.error ||
          'Failed to load products. Please refresh the page.',
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

      await axios.delete(`/api/seller/products/${productId}`);

      setProducts((prev) => prev.filter((product) => product.id !== productId));
      setStatusMessage({
        type: 'success',
        text: `"${productName}" has been deleted.`,
      });
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      setStatusMessage({
        type: 'error',
        text:
          error.response?.data?.error ||
          'Failed to delete product. Please try again.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'SELLER') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={session?.user} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Products</h1>
              <p className="text-gray-600">Manage your product listings</p>
            </div>
            <Link
              href="/seller/products/new"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              Add New Product
            </Link>
          </div>

          {statusMessage && (
            <div
              className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
                statusMessage.type === 'success'
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          {products.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-500 mb-4">No products yet</p>
              <Link
                href="/seller/products/new"
                className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Create Your First Product
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const firstImage = product.images && product.images.length > 0 ? product.images[0] : null;
                
                return (
                  <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                      {firstImage ? (
                        <img
                          src={firstImage}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // If image fails to load, show placeholder
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
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                    <p className="text-2xl font-bold text-indigo-600 mb-2">
                      S$ {formatPrice(product.price)}
                    </p>
                    <div className="flex justify-between text-sm text-gray-600 mb-4">
                      <span>Stock: {product.stock}</span>
                      <span>{product.category?.name || 'Uncategorized'}</span>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/seller/products/${product.id}/edit`}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center text-sm"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        disabled={deletingId === product.id}
                        className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm disabled:cursor-not-allowed disabled:opacity-70"
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
      </main>
    </div>
  );
}

