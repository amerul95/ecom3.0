'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { formatPriceValue } from '@/lib/products';
import { productFormSchema, type ProductFormData } from '@/components/products/schema';
import type { Category, ProductResponse } from '@/components/products/types';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type EditProductFormProps = {
  product: ProductResponse['product'];
  categories: Category[];
  onError?: (message: string) => void;
};

export function EditProductForm({ product, categories, onError }: EditProductFormProps) {
  const router = useRouter();
  const params = useParams();
  const productId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema) as Resolver<ProductFormData>,
    defaultValues: {
      name: product.name,
      description: product.description,
      price: formatPriceValue(product.price),
      stock: product.stock.toString(),
      status: (product as { status?: string }).status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      categoryId: product.categoryId || '',
      images: product.images,
      variants: product.variants.map((v) => ({
        name: v.name,
        sku: v.sku,
        price: formatPriceValue(v.price) || '',
        stock: v.stock.toString(),
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variants',
  });

  const currentImages = form.watch('images') || [];
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const saving = form.formState.isSubmitting;

  const handleError = (message: string) => {
    setError(message);
    onError?.(message);
  };

  const handleImageUpload = async (file: File, index: number) => {
    try {
      setUploadProgress((p) => ({ ...p, [index]: 0 }));
      const presignResponse = await axios.post('/api/upload/presign', {
        filename: file.name,
        contentType: file.type,
      });
      const { presignedUrl, publicUrl, method } = presignResponse.data;
      if (method === 'PUT') {
        await axios.put(presignedUrl, file, {
          headers: { 'Content-Type': file.type },
          onUploadProgress: (e) => {
            const total = e.total;
            if (total) {
              setUploadProgress((p) => ({ ...p, [index]: Math.round((e.loaded * 100) / total) }));
            }
          },
        });
      } else {
        const { supabaseClient } = await import('@/lib/storage');
        const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'uploads';
        const key = presignResponse.data.key;
        const { error: uploadError } = await supabaseClient()
          .storage.from(bucketName)
          .upload(key, file, { contentType: file.type, upsert: true });
        if (uploadError) throw uploadError;
      }
      const imgs = form.getValues('images') || [];
      form.setValue('images', [...imgs, publicUrl]);
      setUploadProgress((p) => ({ ...p, [index]: 100 }));
      return publicUrl;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      handleError(e.response?.data?.error || e.message || 'Upload failed');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const imgs = form.getValues('images') || [];
    const remaining = 4 - imgs.length;
    if (remaining === 0) {
      handleError('Maximum 4 images allowed.');
      e.target.value = '';
      return;
    }
    const toUpload = files.slice(0, remaining);
    setError(null);
    setUploading(true);
    try {
      for (let i = 0; i < toUpload.length; i++) {
        await handleImageUpload(toUpload[i], imgs.length + i);
      }
    } catch {
      // handleError already set
    } finally {
      setUploading(false);
    }
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const imgs = form.getValues('images') || [];
    form.setValue(
      'images',
      imgs.filter((_, i) => i !== index)
    );
    setError(null);
  };

  const moveImageToMain = (index: number) => {
    const imgs = [...(form.getValues('images') || [])];
    const [moved] = imgs.splice(index, 1);
    imgs.unshift(moved);
    form.setValue('images', imgs);
  };

  const onSubmit = async (data: ProductFormData) => {
    setError(null);
    try {
      await axios.patch(
        `/api/admin/products/${productId}`,
        {
          name: data.name,
          description: data.description,
          price: Number(data.price),
          stock: Number(data.stock),
          status: data.status ?? 'ACTIVE',
          images: data.images,
          categoryId: data.categoryId || null,
          variants: data.variants?.map((v) => ({
            name: v.name,
            sku: v.sku,
            stock: Number(v.stock),
            price: v.price === null || v.price === '' ? null : Number(v.price),
          })),
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      router.push('/admin/products');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; details?: { message: string }[] }; status?: number } };
      if (e.response?.status === 409) {
        handleError(e.response?.data?.error || 'Duplicate SKU detected.');
      } else {
        handleError(
          e.response?.data?.error ||
            e.response?.data?.details?.map((d) => d.message).join(', ') ||
            'Failed to update product.'
        );
      }
    }
  };

  return (
    <>
      {error && (
        <Card className="mb-6 border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive whitespace-pre-line">{error}</p>
          </CardContent>
        </Card>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic details</CardTitle>
              <CardDescription>Name, description, price, and stock.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <textarea
                        className={cn(
                          "flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                        )}
                        placeholder="Describe your product"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (SGD) *</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock *</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? 'ACTIVE'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Product status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active (visible in store)</SelectItem>
                        <SelectItem value="INACTIVE">Inactive (hidden from store)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === '__none__' ? '' : v)}
                      value={field.value || '__none__'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
              <CardDescription>Main image required, up to 4 total. First image is main.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="images"
                render={() => (
                  <FormItem>
                    <FormLabel>Product images *</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageSelect}
                        disabled={currentImages.length >= 4}
                        className="cursor-pointer"
                      />
                    </FormControl>
                    {currentImages.length >= 4 && (
                      <FormDescription>Maximum 4 images. Remove one to add more.</FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              {currentImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {currentImages.map((url, index) => (
                    <div key={url} className="relative group rounded-lg border overflow-hidden">
                      <img src={url} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover" />
                      {index === 0 && (
                        <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded">
                          Main
                        </span>
                      )}
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                        {index + 1}/{currentImages.length}
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute bottom-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100"
                        onClick={() => removeImage(index)}
                      >
                        ×
                      </Button>
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="absolute bottom-2 left-2 text-xs opacity-0 group-hover:opacity-100"
                          onClick={() => moveImageToMain(index)}
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
                    <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => remove(index)}>
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`variants.${index}.name`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Size: M" {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`variants.${index}.sku`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>SKU</FormLabel>
                          <FormControl>
                            <Input placeholder="Unique SKU" {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`variants.${index}.price`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>Price (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Override price" {...f} value={f.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`variants.${index}.stock`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>Stock</FormLabel>
                          <FormControl>
                            <Input placeholder="0" {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={saving || uploading}>
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/admin/products')}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
