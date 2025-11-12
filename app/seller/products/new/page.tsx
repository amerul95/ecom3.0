'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';

// Input schema for form (strings before transformation)
const productFormInputSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(255, "Name is too long"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
  stock: z.string().regex(/^\d+$/, "Stock must be a number"),
  categoryId: z.string().optional(),
  images: z.array(z.string())
    .min(1, "At least one image (main image) is required")
    .max(4, "Maximum 4 images allowed"),
  variants: z.array(z.object({
    name: z.string().min(1, "Variant name is required"),
    sku: z.string().min(1, "SKU is required"),
    price: z.union([
      z.string().regex(/^\d+(\.\d{1,2})?$/),
      z.literal(''),
    ]).optional().nullable(),
    stock: z.string().regex(/^\d+$/, "Stock must be a number"),
  })).default([]),
});

// Validation schema for API (with transformation)
const productFormSchema = productFormInputSchema.extend({
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format").transform(Number),
  stock: z.string().regex(/^\d+$/, "Stock must be a number").transform(Number),
  variants: z.array(z.object({
    name: z.string().min(1, "Variant name is required"),
    sku: z.string().min(1, "SKU is required"),
    price: z.union([
      z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number),
      z.literal('').transform(() => null),
    ]).optional().nullable(),
    stock: z.string().regex(/^\d+$/, "Stock must be a number").transform(Number),
  })).default([]),
});

type ProductFormData = z.infer<typeof productFormSchema>;
type ProductFormInput = z.infer<typeof productFormInputSchema> & {
  variants: Array<{
    name: string;
    sku: string;
    stock: string;
    price?: string | null;
  }>;
};

interface Category {
  id: string;
  name: string;
  slug: string;
}

type UploadMode = 'single' | 'multiple';

export default function NewProductPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadMode, setUploadMode] = useState<UploadMode>('single');
  const [multipleProducts, setMultipleProducts] = useState<ProductFormInput[]>([
    {
      name: '',
      description: '',
      price: '',
      stock: '',
      categoryId: '',
      images: [],
      variants: [],
    },
  ]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    watch,
    setValue,
  } = useForm<ProductFormInput>({
    resolver: zodResolver(productFormInputSchema) as any,
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

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/categories');
        setCategories(response.data.categories || []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Redirect if not authenticated or not seller
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

  // Handle image upload
  const handleImageUpload = async (file: File, index: number) => {
    try {
      setUploading(true);
      setUploadProgress({ ...uploadProgress, [index]: 0 });

      // Get presigned URL
      const presignResponse = await axios.post('/api/upload/presign', {
        filename: file.name,
        contentType: file.type,
      });

      const { presignedUrl, publicUrl } = presignResponse.data;

      // Upload to S3
      await axios.put(presignedUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress({ ...uploadProgress, [index]: percentCompleted });
          }
        },
      });

      // Add image URL to form
      const currentImages = watch('images') || [];
      setValue('images', [...currentImages, publicUrl]);
      setUploadProgress({ ...uploadProgress, [index]: 100 });

      return publicUrl;
    } catch (error: any) {
      console.error('Image upload failed:', error);
      
      // Provide helpful CORS error message
      let errorMessage = error.response?.data?.error || error.message;
      
      if (error.message?.includes('Network Error') || error.message?.includes('CORS')) {
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
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Handle multiple image selection (max 4 images)
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentImages = watch('images') || [];
    const remainingSlots = 4 - currentImages.length;
    
    if (remainingSlots === 0) {
      setError('Maximum 4 images allowed. Please remove an image first.');
      e.target.value = ''; // Clear input
      return;
    }

    // Limit to remaining slots
    const filesToUpload = files.slice(0, remainingSlots);
    
    if (files.length > remainingSlots) {
      setError(`You can only upload ${remainingSlots} more image(s). Only the first ${remainingSlots} will be uploaded.`);
    }

    setError(null);
    const uploadPromises = filesToUpload.map((file, index) => 
      handleImageUpload(file, currentImages.length + index)
    );
    
    try {
      await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Some images failed to upload:', error);
    }
    
    e.target.value = ''; // Clear input after upload
  };

  // Remove image
  const removeImage = (index: number) => {
    const currentImages = watch('images') || [];
    setValue('images', currentImages.filter((_, i) => i !== index));
    setError(null);
  };

  // Move image to different position (to change main image)
  const moveImage = (fromIndex: number, toIndex: number) => {
    const currentImages = watch('images') || [];
    if (fromIndex === toIndex) return;
    
    const newImages = [...currentImages];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setValue('images', newImages);
  };

  // Add/Remove products in multiple mode
  const addProduct = () => {
    setMultipleProducts([
      ...multipleProducts,
      {
        name: '',
        description: '',
        price: '',
        stock: '',
        categoryId: '',
        images: [],
        variants: [],
      } as ProductFormInput,
    ]);
  };

  const removeProduct = (index: number) => {
    if (multipleProducts.length > 1) {
      setMultipleProducts(multipleProducts.filter((_, i) => i !== index));
    }
  };

  const updateMultipleProduct = (index: number, field: keyof ProductFormInput, value: any) => {
    const updated = [...multipleProducts];
    updated[index] = { ...updated[index], [field]: value };
    setMultipleProducts(updated);
  };

  // Submit single product
  const onSubmit = async (data: ProductFormInput) => {
    if (uploadMode === 'multiple') {
      await onSubmitMultiple();
      return;
    }

    try {
      setError(null);
      
      // Transform variant prices - convert empty strings to null
      const transformedData = {
        ...data,
        variants: data.variants?.map((v) => ({
          ...v,
          price: v.price === '' || v.price === null ? null : v.price,
        })),
      };
      
      const response = await axios.post('/api/seller/products', transformedData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 201) {
        router.push('/seller/products');
      }
    } catch (error: any) {
      console.error('Failed to create product:', error);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        setError(
          error.response?.data?.error || 
          'Seller profile not found. Please complete your seller profile setup first.'
        );
      } else if (error.response?.status === 403) {
        setError(
          error.response?.data?.error || 
          'Your seller account is not verified yet. Please wait for admin approval.'
        );
      } else {
        setError(
          error.response?.data?.error ||
          error.response?.data?.details?.map((d: any) => d.message).join(', ') ||
          'Failed to create product. Please try again.'
        );
      }
    }
  };

  // Submit multiple products
  const onSubmitMultiple = async () => {
    try {
      setError(null);
      setBulkStatus(null);
      setBulkSubmitting(true);

      const validatedProducts = multipleProducts.map((product, index) => {
        try {
          return productFormSchema.parse({
            ...product,
            price: product.price === '' ? '0' : product.price,
            stock: product.stock === '' ? '0' : product.stock,
          });
        } catch (err) {
          throw new Error(`Product ${index + 1} has validation errors`);
        }
      });

      const transformedProducts = validatedProducts.map((product) => ({
        ...product,
        variants: product.variants?.map((v) => ({
          ...v,
          price: v.price === null || v.price === undefined ? null : v.price,
        })),
      }));

      const response = await axios.post('/api/seller/products/bulk', {
        products: transformedProducts,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const summary = response.data?.summary;

      setBulkStatus({
        type: 'success',
        text: summary
          ? `Successfully created ${summary.created} of ${summary.total} product(s).`
          : response.data?.message || 'Products created successfully.',
      });

      setTimeout(() => {
        router.push('/seller/products');
      }, 1200);
    } catch (error: any) {
      console.error('Failed to create products:', error);
      const message =
        error.response?.data?.error ||
        error.response?.data?.details?.map((d: any) => d.message).join(', ') ||
        (error.message ?? 'Failed to create products. Please check all fields and try again.');
      setError(message);
      setBulkStatus({
        type: 'error',
        text: message,
      });
    } finally {
      setBulkSubmitting(false);
    }
  };

  if (status === 'loading') {
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Product</h1>
            <p className="text-gray-600">Fill in the details to create a new product listing</p>
            
            {/* Mode Selector */}
            <div className="mt-4 flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="uploadMode"
                  value="single"
                  checked={uploadMode === 'single'}
                  onChange={(e) => setUploadMode(e.target.value as UploadMode)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Single Product</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="uploadMode"
                  value="multiple"
                  checked={uploadMode === 'multiple'}
                  onChange={(e) => setUploadMode(e.target.value as UploadMode)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Multiple Products</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {uploadMode === 'single' ? (
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              {/* Single Product Form - Existing form */}
              {/* Product Name */}
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

            {/* Description */}
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

            {/* Price and Stock */}
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

            {/* Category */}
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

            {/* Images - Max 4, first is main image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Images * (1 main image required, up to 4 total)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                First image will be used as main image in product listings. Additional images will be shown on product detail page.
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
              
              {/* Image Preview */}
              {currentImages.length > 0 && (
                <div className="mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {currentImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <div className="relative">
                          <img
                            src={imageUrl}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-300"
                          />
                          {/* Main Image Badge */}
                          {index === 0 && (
                            <div className="absolute top-2 left-2 bg-indigo-600 text-white text-xs font-semibold px-2 py-1 rounded">
                              Main Image
                            </div>
                          )}
                          {/* Image Number Badge */}
                          <div className="absolute top-2 right-2 bg-gray-800 bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                            {index + 1} / {currentImages.length}
                          </div>
                          {/* Remove Button */}
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
                          {/* Move to Main Button (for non-main images) */}
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
                          {/* Upload Progress */}
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
                  <p className="mt-2 text-xs text-gray-500">
                    💡 Tip: The first image (Main Image) will be shown in product listings. Drag or use "Set Main" to change the main image.
                  </p>
                </div>
              )}
            </div>

            {/* Variants */}
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
                        <p className="mt-1 text-xs text-red-600">{errors.variants[index]?.name?.message}</p>
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
                        <p className="mt-1 text-xs text-red-600">{errors.variants[index]?.sku?.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Price (optional)</label>
                      <input
                        {...register(`variants.${index}.price`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Override price"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Stock</label>
                      <input
                        {...register(`variants.${index}.stock`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="0"
                      />
                      {errors.variants?.[index]?.stock && (
                        <p className="mt-1 text-xs text-red-600">{errors.variants[index]?.stock?.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting || uploading}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? 'Creating...' : 'Create Product'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Multiple Products</h2>
                <button
                  type="button"
                  onClick={addProduct}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                >
                  + Add Product
                </button>
              </div>

              <div className="space-y-8">
                {multipleProducts.map((product, productIndex) => (
                  <div key={productIndex} className="border border-gray-200 rounded-lg p-6 space-y-4">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Product {productIndex + 1}</h3>
                      {multipleProducts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProduct(productIndex)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          value={product.name}
                          onChange={(e) => updateMultipleProduct(productIndex, 'name', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="Enter product name"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description *
                        </label>
                        <textarea
                          value={product.description}
                          onChange={(e) => updateMultipleProduct(productIndex, 'description', e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="Describe your product"
                        />
                      </div>

                      {/* Price and Stock */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price (SGD) *
                          </label>
                          <input
                            type="text"
                            value={product.price}
                            onChange={(e) => updateMultipleProduct(productIndex, 'price', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Stock *
                          </label>
                          <input
                            type="text"
                            value={product.stock}
                            onChange={(e) => updateMultipleProduct(productIndex, 'stock', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category
                        </label>
                        <select
                          value={product.categoryId}
                          onChange={(e) => updateMultipleProduct(productIndex, 'categoryId', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select a category (optional)</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Images - Max 4, first is main image */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product Images * (1 main image required, up to 4 total)
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                          First image will be used as main image in product listings.
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={async (e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              const files = Array.from(e.target.files);
                              const currentImages = product.images || [];
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

                              const uploadedUrls: string[] = [];
                              
                              for (let i = 0; i < filesToUpload.length; i++) {
                                const file = filesToUpload[i];
                                try {
                                  setUploading(true);
                                  const presignResponse = await axios.post('/api/upload/presign', {
                                    filename: file.name,
                                    contentType: file.type,
                                  });

                                  const { presignedUrl, publicUrl } = presignResponse.data;

                                  await axios.put(presignedUrl, file, {
                                    headers: {
                                      'Content-Type': file.type,
                                    },
                                  });

                                  uploadedUrls.push(publicUrl);
                                } catch (err) {
                                  console.error('Image upload failed:', err);
                                  setError(`Failed to upload ${file.name}`);
                                } finally {
                                  setUploading(false);
                                }
                              }
                              
                              updateMultipleProduct(productIndex, 'images', [...currentImages, ...uploadedUrls]);
                              e.target.value = '';
                            }
                          }}
                          disabled={uploading || (product.images?.length || 0) >= 4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        {(product.images?.length || 0) >= 4 && (
                          <p className="mt-1 text-sm text-yellow-600">Maximum 4 images reached. Remove an image to add more.</p>
                        )}
                        {product.images && product.images.length > 0 && (
                          <div className="mt-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {product.images.map((imageUrl, imgIndex) => (
                                <div key={imgIndex} className="relative group">
                                  <div className="relative">
                                    <img
                                      src={imageUrl}
                                      alt={`Product ${productIndex + 1} - Image ${imgIndex + 1}`}
                                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-300"
                                    />
                                    {/* Main Image Badge */}
                                    {imgIndex === 0 && (
                                      <div className="absolute top-2 left-2 bg-indigo-600 text-white text-xs font-semibold px-2 py-1 rounded">
                                        Main Image
                                      </div>
                                    )}
                                    {/* Image Number Badge */}
                                    <div className="absolute top-2 right-2 bg-gray-800 bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                                      {imgIndex + 1} / {product.images.length}
                                    </div>
                                    {/* Remove Button */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updatedImages = product.images.filter((_, i) => i !== imgIndex);
                                        updateMultipleProduct(productIndex, 'images', updatedImages);
                                      }}
                                      className="absolute bottom-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                      title="Remove image"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                    {/* Move to Main Button (for non-main images) */}
                                    {imgIndex > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updatedImages = [...product.images];
                                          const [movedImage] = updatedImages.splice(imgIndex, 1);
                                          updatedImages.unshift(movedImage);
                                          updateMultipleProduct(productIndex, 'images', updatedImages);
                                        }}
                                        className="absolute bottom-2 left-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                        title="Set as main image"
                                      >
                                        Set Main
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {bulkStatus && (
                <div
                  className={`mt-6 rounded-lg border px-4 py-3 text-sm ${
                    bulkStatus.type === 'success'
                      ? 'border-green-200 bg-green-50 text-green-800'
                      : 'border-red-200 bg-red-50 text-red-800'
                  }`}
                >
                  {bulkStatus.text}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-6 mt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onSubmitMultiple}
                  disabled={bulkSubmitting || uploading}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                >
                  {bulkSubmitting && (
                    <svg
                      className="h-4 w-4 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                  )}
                  {bulkSubmitting ? 'Uploading products...' : `Create ${multipleProducts.length} Product(s)`}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

