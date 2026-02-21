import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""; // Service role key for server-side operations
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""; // Anon key for client-side operations

// S3-compatible configuration for Supabase Storage
// If endpoint is not provided, construct it from Supabase URL
const SUPABASE_S3_ENDPOINT = process.env.SUPABASE_S3_ENDPOINT || 
  (supabaseUrl ? `${supabaseUrl}/storage/v1/s3` : "");
const SUPABASE_S3_ACCESS_KEY_ID = process.env.SUPABASE_S3_ACCESS_KEY_ID || "";
const SUPABASE_S3_SECRET_ACCESS_KEY = process.env.SUPABASE_S3_SECRET_ACCESS_KEY || "";
const SUPABASE_S3_REGION = process.env.SUPABASE_S3_REGION || "ap-northeast-2"; // Default to your Supabase region

// Initialize S3-compatible client for Supabase Storage
const s3Client = SUPABASE_S3_ENDPOINT && SUPABASE_S3_ACCESS_KEY_ID && SUPABASE_S3_SECRET_ACCESS_KEY
  ? new S3Client({
      endpoint: SUPABASE_S3_ENDPOINT,
      region: SUPABASE_S3_REGION,
      credentials: {
        accessKeyId: SUPABASE_S3_ACCESS_KEY_ID,
        secretAccessKey: SUPABASE_S3_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true, // Required for S3-compatible APIs
    })
  : null;

// Server-side client with service role (full access)
const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Client-side client with anon key (public access)
// Initialize lazily to avoid issues with SSR
let supabaseClientInstance: SupabaseClient | null = null;

export const supabaseClient = (): SupabaseClient => {
  if (!supabaseClientInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase URL and anon key must be set in environment variables");
    }
    supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClientInstance;
};

const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "uploads";

/**
 * Get a presigned URL for uploading a file to Supabase Storage via S3-compatible API
 */
export async function getPresignedPostUrl(
  key: string,
  contentType: string
): Promise<string> {
  try {
    // Use S3-compatible API if configured
    if (s3Client) {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
      return url;
    }

    // Fallback to Supabase native API
    if (!supabaseAdmin) {
      throw new Error("Storage client not initialized. Check SUPABASE_S3_ACCESS_KEY_ID or SUPABASE_SERVICE_ROLE_KEY.");
    }
    // For Supabase native API, return the upload endpoint
    return `${supabaseUrl}/storage/v1/object/${BUCKET_NAME}/${key}`;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Get the public URL for a file in Supabase Storage
 * If the bucket is public, returns the public URL
 * Otherwise, returns a signed URL (valid for 1 hour)
 */
export async function getStoragePublicUrl(key: string): Promise<string> {
  try {
    if (!supabaseAdmin) {
      throw new Error("Supabase admin client not initialized. Check SUPABASE_SERVICE_ROLE_KEY.");
    }
    // First, try to get public URL (if bucket is public)
    const { data: publicData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(key);

    // Check if the file exists and bucket is public
    // If not, generate a signed URL
    const { data: fileData } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list(key.split("/").slice(0, -1).join("/"), {
        limit: 1,
        search: key.split("/").pop() || "",
      });

    // If file exists, return public URL (or signed URL if bucket is private)
    if (fileData && fileData.length > 0) {
      return publicData.publicUrl;
    }

    // Generate signed URL for private buckets (valid for 1 hour)
    const { data: signedData, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(key, 3600);

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return signedData.signedUrl;
  } catch (error: any) {
    // Fallback to public URL
    if (!supabaseAdmin) {
      throw error;
    }
    const { data } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(key);
    return data.publicUrl;
  }
}

/**
 * Get public URL synchronously (for public buckets)
 * Use this when you know the bucket is public
 */
export function getStoragePublicUrlSync(key: string): string {
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }
  // For Supabase Storage, construct public URL
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${key}`;
}

/**
 * Get S3-compatible public URL (if using S3-compatible API)
 */
export function getS3PublicUrl(key: string): string {
  // If using S3-compatible API, construct S3-style URL
  if (SUPABASE_S3_ENDPOINT) {
    // S3-compatible public URL format
    const endpoint = SUPABASE_S3_ENDPOINT.replace('/storage/v1/s3', '');
    return `${endpoint}/storage/v1/object/public/${BUCKET_NAME}/${key}`;
  }
  // Fallback to Supabase native URL
  return getStoragePublicUrlSync(key);
}

/**
 * Upload a file directly to Supabase Storage (server-side)
 */
export async function uploadFile(
  key: string,
  file: Buffer | File | Blob,
  contentType: string,
  options?: {
    upsert?: boolean;
    cacheControl?: string;
  }
): Promise<{ path: string; publicUrl: string }> {
  try {
    if (!supabaseAdmin) {
      throw new Error("Supabase admin client not initialized. Check SUPABASE_SERVICE_ROLE_KEY.");
    }
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(key, file, {
        contentType,
        upsert: options?.upsert ?? true,
        cacheControl: options?.cacheControl || "3600",
      });

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      publicUrl: urlData.publicUrl,
    };
  } catch (error: any) {
    throw error;
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(key: string): Promise<void> {
  try {
    if (!supabaseAdmin) {
      throw new Error("Supabase admin client not initialized. Check SUPABASE_SERVICE_ROLE_KEY.");
    }
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([key]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  } catch (error: any) {
    throw error;
  }
}

/**
 * Test Supabase Storage connection and configuration
 * Supports both S3-compatible API and native Supabase API
 */
export async function testStorageConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    // Test S3-compatible API first if configured
    // Re-check S3 config dynamically
    const currentS3Endpoint = process.env.SUPABASE_S3_ENDPOINT || "";
    const currentS3AccessKey = process.env.SUPABASE_S3_ACCESS_KEY_ID || "";
    const currentS3Secret = process.env.SUPABASE_S3_SECRET_ACCESS_KEY || "";
    const currentS3Region = process.env.SUPABASE_S3_REGION || "ap-northeast-2";
    const currentBucket = process.env.SUPABASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "uploads";
    
    if (currentS3Endpoint && currentS3AccessKey && currentS3Secret) {
      try {
        // Create S3 client dynamically
        const testS3Client = new S3Client({
          endpoint: currentS3Endpoint,
          region: currentS3Region,
          credentials: {
            accessKeyId: currentS3AccessKey,
            secretAccessKey: currentS3Secret,
          },
          forcePathStyle: true,
        });
        
        const testKey = `test-${Date.now()}.txt`;
        const command = new PutObjectCommand({
          Bucket: currentBucket,
          Key: testKey,
          ContentType: "text/plain",
        });
        
        const testUrl = await getSignedUrl(testS3Client, command, { expiresIn: 3600 });
        
        return {
          success: true,
          message: "Supabase Storage (S3-compatible) connection successful",
          details: {
            method: "S3-compatible API",
            bucket: currentBucket,
            endpoint: currentS3Endpoint,
            region: currentS3Region,
            testUrl: testUrl.substring(0, 100) + "...",
          },
        };
      } catch (s3Error: any) {
        return {
          success: false,
          message: `S3-compatible API connection failed: ${s3Error.message}`,
          details: {
            method: "S3-compatible API",
            error: s3Error.name || s3Error.code,
            endpoint: currentS3Endpoint,
            bucket: currentBucket,
          },
        };
      }
    }

    // Fallback to Supabase native API
    // Re-read env vars dynamically to ensure they're loaded
    const currentSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const currentSupabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const currentBucketName = process.env.SUPABASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "uploads";
    
    if (!currentSupabaseUrl || !currentSupabaseServiceKey || !currentBucketName) {
      return {
        success: false,
        message: "Missing Supabase Storage configuration",
        details: {
          hasUrl: !!currentSupabaseUrl,
          hasServiceKey: !!currentSupabaseServiceKey,
          hasS3Config: !!(process.env.SUPABASE_S3_ACCESS_KEY_ID && process.env.SUPABASE_S3_SECRET_ACCESS_KEY),
          bucket: currentBucketName,
          envVars: {
            NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET,
          }
        },
      };
    }

    // Re-create admin client with current env vars if needed
    
    if (!currentSupabaseUrl || !currentSupabaseServiceKey) {
      return {
        success: false,
        message: "Supabase admin client not initialized",
        details: {
          hasUrl: !!currentSupabaseUrl,
          hasServiceKey: !!currentSupabaseServiceKey,
          bucket: currentBucketName,
        },
      };
    }

    // Create admin client dynamically
    const adminClient = createClient(currentSupabaseUrl, currentSupabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Test by listing buckets
    const { data: buckets, error: listError } = await adminClient.storage.listBuckets();

    if (listError) {
      return {
        success: false,
        message: `Failed to list buckets: ${listError.message}`,
      };
    }

    // Check if our bucket exists
    const bucketExists = buckets?.some((b) => b.name === currentBucketName);

    if (!bucketExists) {
      return {
        success: false,
        message: `Bucket "${currentBucketName}" does not exist. Please create it in Supabase Dashboard.`,
        details: {
          availableBuckets: buckets?.map((b) => b.name) || [],
          requestedBucket: currentBucketName,
        },
      };
    }

    // Test by trying to generate a signed URL
    const testKey = `test-${Date.now()}.txt`;
    await getPresignedPostUrl(testKey, "text/plain");

    return {
      success: true,
      message: "Supabase Storage (native API) connection successful",
      details: {
        method: "Native Supabase API",
        bucket: currentBucketName,
        supabaseUrl: currentSupabaseUrl,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Storage connection failed: ${error.message}`,
      details: {
        error: error.name || error.code,
      },
    };
  }
}

// Legacy compatibility - getS3PublicUrl is now defined above
