'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Link from 'next/link';
import { Card } from '../components/card/Card';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number | string;
  stock: number;
  images: string[];
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  seller: {
    user: {
      name: string | null;
      email: string | null;
    };
  };
  variants: Array<{
    id: string;
    name: string;
    sku: string;
    price: number | string | null;
    stock: number | null;
  }>;
  averageRating?: number;
  reviewCount?: number;
  relatedProducts?: Product[];
}

// Helper function to format price
function formatPrice(price: number | string | null): string {
  if (price === null || price === undefined) return '0.00';
  if (typeof price === 'number') {
    return price.toFixed(2);
  }
  if (typeof price === 'string') {
    return parseFloat(price).toFixed(2);
  }
  return '0.00';
}

export const ProductDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const slug = params?.slug as string | undefined;
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [cartMessage, setCartMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;

      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get(`/api/products/${slug}`);
        setProduct(response.data);
      } catch (err: any) {
        console.error('Failed to fetch product:', err);
        if (err.response?.status === 404) {
          setError('Product not found');
        } else {
          setError('Failed to load product');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product || status !== 'authenticated') {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    if (product.stock <= 0) {
      setCartMessage('Out of stock');
      setTimeout(() => setCartMessage(null), 2000);
      return;
    }

    try {
      setIsAddingToCart(true);
      setCartMessage(null);

      const response = await axios.post('/api/cart', {
        productId: product.id,
        variantId: selectedVariant || undefined,
        quantity,
      });

      if (response.status === 201 || response.status === 200) {
        setCartMessage('Added to cart!');
        setTimeout(() => setCartMessage(null), 2000);
      }
    } catch (error: any) {
      console.error('Failed to add to cart:', error);
      if (error.response?.status === 401) {
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      } else {
        setCartMessage(error.response?.data?.error || 'Failed to add to cart');
        setTimeout(() => setCartMessage(null), 3000);
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product || status !== 'authenticated') {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    if (product.stock <= 0) {
      setCartMessage('Out of stock');
      setTimeout(() => setCartMessage(null), 2000);
      return;
    }

    try {
      setIsAddingToCart(true);
      setCartMessage(null);

      const response = await axios.post('/api/cart', {
        productId: product.id,
        variantId: selectedVariant || undefined,
        quantity,
      });

      if (response.status === 201 || response.status === 200) {
        router.push('/checkout');
      }
    } catch (error: any) {
      console.error('Failed to add to cart:', error);
      if (error.response?.status === 401) {
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      } else {
        setCartMessage(error.response?.data?.error || 'Failed to process');
        setTimeout(() => setCartMessage(null), 3000);
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The product you are looking for does not exist.'}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const mainImage = product.images && product.images.length > 0 ? product.images[selectedImageIndex] : null;
  const hasVariants = product.variants && product.variants.length > 0;
  const selectedVariantData = selectedVariant
    ? product.variants.find(v => v.id === selectedVariant)
    : null;
  const displayPrice = selectedVariantData?.price
    ? formatPrice(selectedVariantData.price)
    : formatPrice(product.price);
  const availableStock = selectedVariantData?.stock !== null && selectedVariantData?.stock !== undefined
    ? selectedVariantData.stock
    : product.stock;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-2">
          <li className="inline-flex items-center">
            <Link href="/" className="text-sm font-medium text-gray-700 hover:text-indigo-600">
              Home
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              {product.category && (
                <Link
                  href={`/${product.category.slug}`}
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600"
                >
                  {product.category.name}
                </Link>
              )}
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-gray-500">{product.name}</span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Product Images */}
        <div>
          <div className="sticky top-4">
            {/* Main Image */}
            <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4 border border-gray-200">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/placeholder.png';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <span className="text-gray-400">No Image Available</span>
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-indigo-600 ring-2 ring-indigo-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/placeholder.png';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

          {/* Rating */}
          {product.averageRating !== undefined && product.averageRating > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(product.averageRating || 0)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {product.averageRating.toFixed(1)} ({product.reviewCount || 0} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="mb-6">
            <p className="text-4xl font-bold text-indigo-600">S$ {displayPrice}</p>
            {product.category && (
              <p className="text-sm text-gray-500 mt-1">Category: {product.category.name}</p>
            )}
          </div>

          {/* Stock Status */}
          <div className="mb-6">
            {availableStock > 0 ? (
              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                In Stock ({availableStock} available)
              </span>
            ) : (
              <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                Out of Stock
              </span>
            )}
          </div>

          {/* Variants */}
          {hasVariants && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Variant
              </label>
              <div className="space-y-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant.id)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedVariant === variant.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{variant.name}</span>
                      <div className="text-right">
                        {variant.price && (
                          <span className="text-indigo-600 font-semibold">
                            S$ {formatPrice(variant.price)}
                          </span>
                        )}
                        {variant.stock !== null && (
                          <span className="text-xs text-gray-500 block mt-1">
                            Stock: {variant.stock}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="px-4 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  −
                </button>
                <span className="px-4 py-2 border-x border-gray-300 min-w-[60px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                  disabled={quantity >= availableStock}
                  className="px-4 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
              <span className="text-sm text-gray-600">
                Max: {availableStock}
              </span>
            </div>
          </div>

          {/* Cart Message */}
          {cartMessage && (
            <div className={`mb-4 p-3 rounded-lg ${
              cartMessage.includes('Added') || cartMessage.includes('success')
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {cartMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={handleBuyNow}
              disabled={availableStock <= 0 || isAddingToCart}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {isAddingToCart ? 'Processing...' : 'Buy Now'}
            </button>
            <button
              onClick={handleAddToCart}
              disabled={availableStock <= 0 || isAddingToCart}
              className="flex-1 px-6 py-3 bg-white text-indigo-600 border-2 border-indigo-600 rounded-lg hover:bg-indigo-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {isAddingToCart ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>

          {/* Description */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
            <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
          </div>

          {/* Seller Info */}
          {product.seller && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Sold by</p>
              <p className="font-medium text-gray-900">
                {product.seller.user.name || product.seller.user.email || 'Unknown Seller'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {product.relatedProducts && product.relatedProducts.length > 0 && (
        <div className="mt-12 border-t border-gray-200 pt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {product.relatedProducts.map((relatedProduct) => (
              <Card key={relatedProduct.id} data={relatedProduct} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

