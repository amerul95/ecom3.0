'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '../../../components/Sidebar';

interface FormData {
  title: string;
  type: 'DRINKWARE' | 'APPAREL' | 'ACCESSORY' | 'OTHER' | '';
  price: string;
  colors: string[];
  images: string[];
}

interface ColorInput {
  value: string;
  id: string;
}

export default function AddItemPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    type: '',
    price: '',
    colors: [],
    images: [],
  });
  const [colorInputs, setColorInputs] = useState<ColorInput[]>([]);
  const [newColor, setNewColor] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleAddColor = () => {
    if (newColor.trim() && !formData.colors.includes(newColor.trim())) {
      setFormData(prev => ({
        ...prev,
        colors: [...prev.colors, newColor.trim()],
      }));
      setColorInputs(prev => [...prev, { value: newColor.trim(), id: Date.now().toString() }]);
      setNewColor('');
    }
  };

  const handleRemoveColor = (colorToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter(c => c !== colorToRemove),
    }));
    setColorInputs(prev => prev.filter(c => c.value !== colorToRemove));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(prev => [...prev, ...files]);
    setError('');
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const uploadImagesToS3 = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || 'ecommv'; // Fallback for display

    for (const file of files) {
      try {
        // Determine content type - use file.type or fallback to image/jpeg
        const contentType = file.type || 'image/jpeg';
        
        // Validate file type
        if (!contentType.startsWith('image/')) {
          throw new Error(`${file.name} is not an image file`);
        }

        // Get presigned URL
        const presignResponse = await fetch('/api/upload/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // Include cookies for authentication
          body: JSON.stringify({
            filename: file.name,
            contentType: contentType,
          }),
        });

        if (!presignResponse.ok) {
          const errorData = await presignResponse.json().catch(() => ({}));
          const errorMessage = errorData.error || `Failed to get presigned URL: ${presignResponse.status}`;
          console.error('Presign error:', errorMessage, errorData);
          throw new Error(errorMessage);
        }

        const { presignedUrl, publicUrl } = await presignResponse.json();

        if (!presignedUrl || !publicUrl) {
          throw new Error('Invalid response from presign API');
        }

        // Upload to S3 using PUT method
        // The presigned URL signature includes Content-Type, so we must match it exactly
        try {
          // Log the upload attempt for debugging
          console.log('Attempting S3 upload:', {
            fileName: file.name,
            fileSize: file.size,
            contentType: contentType,
            presignedUrlPreview: presignedUrl.substring(0, 100) + '...',
          });

          const uploadResponse = await fetch(presignedUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': contentType, // Must match the contentType used to generate the presigned URL
            },
            mode: 'cors', // Explicitly set CORS mode
            cache: 'no-cache', // Don't cache the request
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text().catch(() => 'Unknown error');
            console.error('S3 upload error details:', {
              status: uploadResponse.status,
              statusText: uploadResponse.statusText,
              error: errorText,
              fileName: file.name,
              fileSize: file.size,
              contentType: contentType,
            });
            
            // Provide more helpful error messages
            if (uploadResponse.status === 403) {
              throw new Error(`Access denied (403). Your S3 bucket CORS configuration is missing or incorrect. Please configure CORS on your S3 bucket.`);
            } else if (uploadResponse.status === 400) {
              throw new Error(`Bad request (400). The file may be corrupted or too large.`);
            } else {
              throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
            }
          }

          console.log('✅ Upload successful for:', file.name);
          uploadedUrls.push(publicUrl);
        } catch (fetchError: any) {
          // Handle network errors separately
          console.error('Fetch error details:', {
            name: fetchError.name,
            message: fetchError.message,
            stack: fetchError.stack?.substring(0, 200),
          });

          if (fetchError.name === 'TypeError' || fetchError.message.includes('fetch')) {
            // Get current origin for CORS configuration
            const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
            const region = 'ap-southeast-1'; // Your bucket region
            
            const detailedError = `CORS Error: Unable to connect to S3.

Your S3 bucket CORS is configured. If you're still seeing this error:

🔧 Troubleshooting:
1. Wait 1-2 minutes after CORS changes (they take time to propagate)
2. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
3. Clear browser cache
4. Check browser console for specific CORS error details

Current CORS Configuration:
- AllowedOrigins: http://localhost:3000, https://localhost:3000, http://127.0.0.1:3000
- AllowedMethods: GET, PUT, POST, DELETE, HEAD
- Bucket: ${bucketName}
- Region: ${region}

If the issue persists, check:
- Your current URL matches one of the allowed origins
- Browser DevTools Network tab for detailed error
- S3 bucket CORS settings are saved correctly`;
            throw new Error(detailedError);
          }
          throw fetchError;
        }
      } catch (err: any) {
        console.error('Image upload error:', err);
        const errorMessage = err.message || `Failed to upload ${file.name}`;
        throw new Error(errorMessage);
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    setUploadingImages(true);

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }
      if (formData.title.length > 80) {
        throw new Error('Title must be 80 characters or less');
      }
      if (!formData.type) {
        throw new Error('Item type is required');
      }
      if (!formData.price) {
        throw new Error('Price is required');
      }
      const priceNum = parseFloat(formData.price);
      if (isNaN(priceNum) || priceNum < 0) {
        throw new Error('Price must be a valid number >= 0');
      }

      // Upload images if any
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        imageUrls = await uploadImagesToS3(imageFiles);
      }

      // Create item
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          type: formData.type,
          price: priceNum,
          colors: formData.colors,
          images: imageUrls,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create item');
      }

      setSuccess('Item created successfully!');
      setTimeout(() => {
        router.push('/seller/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'An error occurred. Please try again.');
      setUploadingImages(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={session?.user} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Item</h1>
            <p className="text-gray-600">Create a new product listing for your store</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}

            {/* Title */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                maxLength={80}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter item title (max 80 characters)"
              />
              <p className="mt-1 text-sm text-gray-500">{formData.title.length}/80 characters</p>
            </div>

            {/* Type */}
            <div className="mb-6">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Item Type <span className="text-red-500">*</span>
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select item type</option>
                <option value="DRINKWARE">Drinkware</option>
                <option value="APPAREL">Apparel</option>
                <option value="ACCESSORY">Accessory</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Price */}
            <div className="mb-6">
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Price (SGD) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00"
              />
            </div>

            {/* Colors */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colors (Optional)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddColor();
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Add a color (e.g., Red, Blue)"
                />
                <button
                  type="button"
                  onClick={handleAddColor}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Add
                </button>
              </div>
              {formData.colors.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.colors.map((color, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                    >
                      {color}
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(color)}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Images */}
            <div className="mb-6">
              <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
                Images (Optional)
              </label>
              <input
                type="file"
                id="images"
                name="images"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {imageFiles.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imageFiles.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting || uploadingImages}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploadingImages
                  ? 'Uploading images...'
                  : isSubmitting
                  ? 'Creating item...'
                  : 'Create Item'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/seller/dashboard')}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
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



