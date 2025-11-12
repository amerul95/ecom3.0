'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import Sidebar from '../../../components/Sidebar';

const priceStringSchema = z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format');
const stockStringSchema = z.string().regex(/^\d+$/, 'Stock must be a number');

const productFormSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(255, 'Name is too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: priceStringSchema,
  stock: stockStringSchema,
  categoryId: z.string().optional(),
  images: z.array(z.string()).min(1, 'At least one image (main image) is required').max(4, 'Maximum 4 images allowed'),
  variants: z.array(z.object({
    name: z.string().min(1, 'Variant name is required'),
    sku: z.string().min(1, 'SKU is required'),
    price: z.union([
      priceStringSchema,
      z.literal(''),
    ]).optional().nullable(),
    stock: stockStringSchema,
  })).default([]),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductResponse {
  product: {
    id: string;
    name: string;
    description: string;
    price: string | number | { toString: () => string };
    stock: number;
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

function formatPriceValue(price: string | number | { toString: () => string } | null): string {
  if (price === null || price === undefined) return '';
  if (typeof price === 'number') return price.toFixed(2);
  if (typeof price === 'string') return price;
  return price.toString();
}

export default function EditProductPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const productId = useMemo(() => {
    if (!params) return '';
    if (Array.isArray(params.id)) {
      return params.id[0] || '';
    }
    return params.id as string;
  }, [params]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema) as Resolver<ProductFormData>,
    defaultValues: {
      name: '',
      description: '',
      price: '',
      stock: '',
      categoryId: '',
      images: [],
      variants: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'variants',
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/categories');
        setCategories(response.data.categories || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      try {
        setLoadingProduct(true);
        const response = await axios.get<ProductResponse>(`/api/seller/products/${productId}`);
        const product = response.data.product;

        reset({
          name: product.name,
          description: product.description,
          price: formatPriceValue(product.price),
          stock: product.stock.toString(),
          categoryId: product.categoryId || '',
          images: product.images,
          variants: product.variants.map((variant) => ({
            name: variant.name,
            sku: variant.sku,
            price: formatPriceValue(variant.price),
            stock: variant.stock.toString(),
          })),
        });
        replace(
          product.variants.map((variant) => ({
            id: variant.id,
            name: variant.name,
            sku: variant.sku,
            price: formatPriceValue(variant.price),
            stock: variant.stock.toString(),
          }))
        );
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch product:', err);
        setError(
          err.response?.data?.error ||
            'Failed to load product. Please refresh the page.'
        );
      } finally {
        setLoadingProduct(false);
      }
    };

    fetchProduct();
  }, [productId, reset, replace]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/seller/login');
      return;
    }
    if (status === 'authenticated' && session?.user?.role !== 'SELLER') {
      router.push('/seller/login?error=unauthorized');
      return;
    }
  }, [status, session, router]);

  const handleImageUpload = async (file: File, index: number) => {
    try {
      setUploading(true);
      setUploadProgress((prev) => ({ ...prev, [index]: 0 }));

      const presignResponse = await axios.post('/api/upload/presign', {
        filename: file.name,
        contentType: file.type,
      });

      const { presignedUrl, publicUrl } = presignResponse.data;

      await axios.put(presignedUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress((prev) => ({ ...prev, [index]: percentCompleted }));
          }
        },
      });

      const currentImages = watch('images') || [];
      setValue('images', [...currentImages, publicUrl]);
      setUploadProgress((prev) => ({ ...prev, [index]: 100 }));

      return publicUrl;
    } catch (err: any) {
      console.error('Image upload failed:', err);
      let errorMessage = err.response?.data?.error || err.message;

      if (err.message?.includes('Network Error') || err.message?.includes('CORS')) {
        errorMessage = `CORS Error: Unable to upload to S3. 

Your S3 bucket CORS is configured. If you're still seeing this error:

1. Wait 1-2 minutes after CORS changes (they take time to propagate)
2. Hard refresh your browser (Ctrl+Shift+R)
3. Clear browser cache
4. Check browser console for specific CORS error details

Current CORS Configuration:
- AllowedOrigins: http://localhost:3000, https://localhost:3000, http://127.0.0.1:3000
- Bucket: ecommv
- Region: ap-southeast-1`;
      }

      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentImages = watch('images') || [];
    const remainingSlots = 4 - currentImages.length;

    if (remainingSlots === 0) {
      setError('Maximum 4 images allowed. Please remove an image first.');
      e.target.value = '';
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      setError(`You can only upload ${remainingSlots} more image(s). Only the first ${remainingSlots} will be uploaded.`);
    }

    setError(null);
    try {
      await Promise.all(
        filesToUpload.map((file, index) =>
          handleImageUpload(file, currentImages.length + index)
        )
      );
    } catch (err) {
      console.error('Some images failed to upload:', err);
    }

    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const currentImages = watch('images') || [];
    setValue('images', currentImages.filter((_, i) => i !== index));
    setError(null);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const currentImages = watch('images') || [];
    if (fromIndex === toIndex) return;

    const newImages = [...currentImages];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setValue('images', newImages);
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      setError(null);
      setSaving(true);

      const payload = {
        name: data.name,
        description: data.description,
        price: Number(data.price),
        stock: Number(data.stock),
        images: data.images,
        categoryId: data.categoryId || null,
        variants: data.variants?.map((variant) => ({
          name: variant.name,
          sku: variant.sku,
          stock: Number(variant.stock),
          price: variant.price === null || variant.price === '' ? null : Number(variant.price),
        })),
      };

      await axios.patch(`/api/seller/products/${productId}`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      router.push('/seller/products');
    } catch (err: any) {
      console.error('Failed to update product:', err);
      if (err.response?.status === 409) {
        setError(
          err.response?.data?.error ||
            'Duplicate SKU detected. Please ensure each variant has a unique SKU.'
        );
      } else {
        setError(
          err.response?.data?.error ||
            err.response?.data?.details?.map((d: any) => d.message).join(', ') ||
            'Failed to update product. Please try again.'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loadingProduct) {
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

  const currentImages = watch('images') || [];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={session?.user} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Product</h1>
            <p className="text-gray-600">Update your product details and save the changes</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm whitespace-pre-line">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter product name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Describe your product in detail"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Price (SGD) *
                </label>
                <input
                  id="price"
                  type="text"
                  {...register('price')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity *
                </label>
                <input
                  id="stock"
                  type="text"
                  {...register('stock')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0"
                />
                {errors.stock && (
                  <p className="mt-1 text-sm text-red-600">{errors.stock.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="categoryId"
                {...register('categoryId')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a category (optional)</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Images * (1 main image required, up to 4 total)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                First image will be used as main image in product listings. Additional images will be shown on the product detail page.
              </p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                disabled={uploading || currentImages.length >= 4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {currentImages.length >= 4 && (
                <p className="mt-1 text-sm text-yellow-600">Maximum 4 images reached. Remove an image to add more.</p>
              )}
              {errors.images && (
                <p className="mt-1 text-sm text-red-600">{errors.images.message}</p>
              )}

              {currentImages.length > 0 && (
                <div className="mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {currentImages.map((imageUrl, index) => (
                      <div key={imageUrl} className="relative group">
                        <div className="relative">
                          <img
                            src={imageUrl}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-300"
                          />
                          {index === 0 && (
                            <div className="absolute top-2 left-2 bg-indigo-600 text-white text-xs font-semibold px-2 py-1 rounded">
                              Main Image
                            </div>
                          )}
                          <div className="absolute top-2 right-2 bg-gray-800 bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                            {index + 1} / {currentImages.length}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute bottom-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            title="Remove image"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => moveImage(index, 0)}
                              className="absolute bottom-2 left-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                              title="Set as main image"
                            >
                              Set Main
                            </button>
                          )}
                          {uploadProgress[index] !== undefined && uploadProgress[index] < 100 && (
                            <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-90 rounded-b-lg h-2">
                              <div
                                className="bg-indigo-500 h-2 rounded-b-lg transition-all"
                                style={{ width: `${uploadProgress[index]}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Product Variants (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => append({ name: '', sku: '', price: '', stock: '' })}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                >
                  Add Variant
                </button>
              </div>

              {fields.length === 0 && (
                <p className="text-sm text-gray-500 mb-4">
                  No variants added yet. Add variants if your product has options like sizes or colors.
                </p>
              )}

              {fields.map((field, index) => (
                <div key={field.id} className="mb-4 p-4 border border-gray-200 rounded-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-700">Variant {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Name</label>
                      <input
                        {...register(`variants.${index}.name`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="e.g., Color: Red, Size: M"
                      />
                      {errors.variants?.[index]?.name && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.variants[index]?.name?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">SKU</label>
                      <input
                        {...register(`variants.${index}.sku`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Unique SKU"
                      />
                      {errors.variants?.[index]?.sku && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.variants[index]?.sku?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Price (optional)</label>
                      <input
                        {...register(`variants.${index}.price`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Override price"
                      />
                      {errors.variants?.[index]?.price && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.variants[index]?.price?.message as string}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Stock</label>
                      <input
                        {...register(`variants.${index}.stock`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="0"
                      />
                      {errors.variants?.[index]?.stock && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.variants[index]?.stock?.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving || uploading}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/seller/products')}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}


