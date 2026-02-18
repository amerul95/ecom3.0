'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

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

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/login?error=unauthorized');
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

      const { presignedUrl, publicUrl, method } = presignResponse.data;

      // Upload to storage (S3-compatible or Supabase native)
      if (method === 'PUT') {
        // S3-compatible API
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
      } else {
        // Supabase native API - use storage client
        const { supabaseClient } = await import('@/lib/storage');
        const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'uploads';
        const key = presignResponse.data.key;
        
        const { error: uploadError } = await supabaseClient().storage
          .from(bucketName)
          .upload(key, file, {
            contentType: file.type,
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }
      }

      // Add image URL to form
      const currentImages = watch('images') || [];
      setValue('images', [...currentImages, publicUrl]);
      setUploadProgress({ ...uploadProgress, [index]: 100 });

      return publicUrl;
    } catch (error: any) {
      console.error('Image upload failed:', error);
      let errorMessage = error.response?.data?.error || error.message;
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
      e.target.value = '';
      return;
    }

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
      
      const transformedData = {
        ...data,
        variants: data.variants?.map((v) => ({
          ...v,
          price: v.price === '' || v.price === null ? null : v.price,
        })),
      };
      
      const response = await axios.post('/api/admin/products', transformedData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 201) {
        router.push('/admin/products');
      }
    } catch (error: any) {
      console.error('Failed to create product:', error);
      setError(
        error.response?.data?.error ||
        error.response?.data?.details?.map((d: any) => d.message).join(', ') ||
        'Failed to create product. Please try again.'
      );
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

      // Note: Bulk endpoint needs to be created for admin
      const response = await axios.post('/api/admin/products', {
        products: transformedProducts,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setBulkStatus({
        type: 'success',
        text: 'Products created successfully.',
      });

      setTimeout(() => {
        router.push('/admin/products');
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
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  const currentImages = watch('images') || [];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Add new product</h1>
          <p className="text-muted-foreground">Fill in the details to create a new product listing.</p>
          <div className="mt-4 flex gap-4">
            <label className="flex items-center cursor-pointer gap-2">
              <input
                type="radio"
                name="uploadMode"
                value="single"
                checked={uploadMode === 'single'}
                onChange={(e) => setUploadMode(e.target.value as UploadMode)}
                className="border-input accent-primary"
              />
              <span className="text-sm font-medium">Single product</span>
            </label>
            <label className="flex items-center cursor-pointer gap-2">
              <input
                type="radio"
                name="uploadMode"
                value="multiple"
                checked={uploadMode === 'multiple'}
                onChange={(e) => setUploadMode(e.target.value as UploadMode)}
                className="border-input accent-primary"
              />
              <span className="text-sm font-medium">Multiple products</span>
            </label>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive whitespace-pre-line">{error}</p>
            </CardContent>
          </Card>
        )}

        {uploadMode === 'single' ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic details</CardTitle>
                <CardDescription>Name, description, price, and stock.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product name *</Label>
                  <Input
                    id="name"
                    type="text"
                    {...register('name')}
                    placeholder="Enter product name"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <textarea
                    id="description"
                    {...register('description')}
                    rows={5}
                    className={cn(
                      "flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                    placeholder="Describe your product in detail"
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (SGD) *</Label>
                    <Input
                      id="price"
                      type="text"
                      {...register('price')}
                      placeholder="0.00"
                    />
                    {errors.price && (
                      <p className="text-sm text-destructive">{errors.price.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock quantity *</Label>
                    <Input
                      id="stock"
                      type="text"
                      {...register('stock')}
                      placeholder="0"
                    />
                    {errors.stock && (
                      <p className="text-sm text-destructive">{errors.stock.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Category</Label>
                  <select
                    id="categoryId"
                    {...register('categoryId')}
                    className={cn(
                      "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                  >
                    <option value="">Select a category (optional)</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
                <CardDescription>Main image required, up to 4 total. First image is main.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Product images *</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    disabled={uploading || currentImages.length >= 4}
                    className="cursor-pointer"
                  />
                  {currentImages.length >= 4 && (
                    <p className="text-sm text-muted-foreground">Maximum 4 images. Remove one to add more.</p>
                  )}
                  {errors.images && (
                    <p className="text-sm text-destructive">{errors.images.message}</p>
                  )}
                </div>
                {currentImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {currentImages.map((imageUrl, index) => (
                      <div key={index} className="relative group rounded-lg border overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover"
                        />
                        {index === 0 && (
                          <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded">
                            Main
                          </span>
                        )}
                        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                          {index + 1} / {currentImages.length}
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute bottom-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100"
                          onClick={() => removeImage(index)}
                          title="Remove image"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </Button>
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="absolute bottom-2 left-2 text-xs opacity-0 group-hover:opacity-100"
                            onClick={() => moveImage(index, 0)}
                            title="Set as main image"
                          >
                            Set main
                          </Button>
                        )}
                        {uploadProgress[index] !== undefined && uploadProgress[index] < 100 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-muted">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${uploadProgress[index]}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Variants</CardTitle>
                    <CardDescription>Optional size/color or other options.</CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ name: '', sku: '', price: '', stock: '' })}
                  >
                    Add variant
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.length === 0 && (
                  <p className="text-sm text-muted-foreground">No variants. Add variants for options like size or color.</p>
                )}
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">Variant {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => remove(index)}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          {...register(`variants.${index}.name`)}
                          placeholder="e.g. Size: M"
                        />
                        {errors.variants?.[index]?.name && (
                          <p className="text-xs text-destructive">{errors.variants[index]?.name?.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>SKU</Label>
                        <Input
                          {...register(`variants.${index}.sku`)}
                          placeholder="Unique SKU"
                        />
                        {errors.variants?.[index]?.sku && (
                          <p className="text-xs text-destructive">{errors.variants[index]?.sku?.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Price (optional)</Label>
                        <Input
                          {...register(`variants.${index}.price`)}
                          placeholder="Override price"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Stock</Label>
                        <Input
                          {...register(`variants.${index}.stock`)}
                          placeholder="0"
                        />
                        {errors.variants?.[index]?.stock && (
                          <p className="text-xs text-destructive">{errors.variants[index]?.stock?.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting || uploading}
              >
                {isSubmitting ? 'Creating...' : 'Create product'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Multiple products</CardTitle>
                    <CardDescription>Add several products at once.</CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addProduct}>
                    + Add product
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {multipleProducts.map((product, productIndex) => (
                  <div key={productIndex} className="rounded-lg border p-6 space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b">
                      <h3 className="font-semibold">Product {productIndex + 1}</h3>
                      {multipleProducts.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() => removeProduct(productIndex)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label>Product name *</Label>
                        <Input
                          type="text"
                          value={product.name}
                          onChange={(e) => updateMultipleProduct(productIndex, 'name', e.target.value)}
                          placeholder="Enter product name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description *</Label>
                        <textarea
                          value={product.description}
                          onChange={(e) => updateMultipleProduct(productIndex, 'description', e.target.value)}
                          rows={3}
                          className={cn(
                            "flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                          )}
                          placeholder="Describe your product"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Price (SGD) *</Label>
                          <Input
                            type="text"
                            value={product.price}
                            onChange={(e) => updateMultipleProduct(productIndex, 'price', e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Stock *</Label>
                          <Input
                            type="text"
                            value={product.stock}
                            onChange={(e) => updateMultipleProduct(productIndex, 'stock', e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <select
                          value={product.categoryId}
                          onChange={(e) => updateMultipleProduct(productIndex, 'categoryId', e.target.value)}
                          className={cn(
                            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                          )}
                        >
                          <option value="">Select a category (optional)</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Product images * (1 main, up to 4)</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={async (e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              const files = Array.from(e.target.files);
                              const currentImages = product.images || [];
                              const remainingSlots = 4 - currentImages.length;
                              if (remainingSlots === 0) {
                                setError('Maximum 4 images allowed.');
                                e.target.value = '';
                                return;
                              }
                              const filesToUpload = files.slice(0, remainingSlots);
                              const uploadedUrls: string[] = [];
                              for (let i = 0; i < filesToUpload.length; i++) {
                                const file = filesToUpload[i];
                                try {
                                  const url = await handleImageUpload(file, currentImages.length + i);
                                  uploadedUrls.push(url);
                                } catch (err) {
                                  console.error('Image upload failed:', err);
                                }
                              }
                              updateMultipleProduct(productIndex, 'images', [...currentImages, ...uploadedUrls]);
                              e.target.value = '';
                            }
                          }}
                          disabled={uploading || (product.images?.length || 0) >= 4}
                          className="cursor-pointer"
                        />
                        {product.images && product.images.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            {product.images.map((imageUrl, imgIndex) => (
                              <div key={imgIndex} className="relative group rounded-lg border overflow-hidden">
                                <img
                                  src={imageUrl}
                                  alt={`Product ${productIndex + 1} - Image ${imgIndex + 1}`}
                                  className="w-full h-32 object-cover"
                                />
                                {imgIndex === 0 && (
                                  <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded">
                                    Main
                                  </span>
                                )}
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute bottom-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100"
                                  onClick={() => {
                                    const updatedImages = product.images.filter((_, i) => i !== imgIndex);
                                    updateMultipleProduct(productIndex, 'images', updatedImages);
                                  }}
                                  title="Remove image"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {bulkStatus && (
                  <Card
                    className={
                      bulkStatus.type === 'success'
                        ? 'border-green-500/50 bg-green-500/10'
                        : 'border-destructive/50 bg-destructive/5'
                    }
                  >
                    <CardContent className="pt-6">
                      <p
                        className={
                          bulkStatus.type === 'success'
                            ? 'text-sm text-green-700 dark:text-green-400'
                            : 'text-sm text-destructive'
                        }
                      >
                        {bulkStatus.text}
                      </p>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    onClick={onSubmitMultiple}
                    disabled={bulkSubmitting || uploading}
                  >
                    {bulkSubmitting ? 'Creating...' : `Create ${multipleProducts.length} product(s)`}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  );
}
