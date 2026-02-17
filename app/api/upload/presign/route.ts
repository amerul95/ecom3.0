import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getPresignedPostUrl, getStoragePublicUrlSync } from "@/lib/storage";
import { uploadSchema } from "@/lib/validations";
import { z } from "zod";
import { randomUUID } from "crypto";

// POST /api/upload/presign - Get upload URL for Supabase Storage
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(); // Must be authenticated

    const body = await request.json();
    const { filename, contentType } = uploadSchema.parse(body);

    // Generate unique key: uploads/{userId}/{uuid}-{filename}
    const extension = filename.split(".").pop() || "jpg";
    const key = `uploads/${user.id}/${randomUUID()}.${extension}`;

    // For Supabase Storage, we return the upload endpoint URL
    // The client should use Supabase client SDK to upload directly
    const uploadUrl = await getPresignedPostUrl(key, contentType);
    const publicUrl = getStoragePublicUrlSync(key);

    // Determine upload method based on API type
    const useS3API = !!(process.env.SUPABASE_S3_ACCESS_KEY_ID && process.env.SUPABASE_S3_SECRET_ACCESS_KEY);
    
    return NextResponse.json({
      presignedUrl: uploadUrl,
      key,
      publicUrl,
      method: useS3API ? "PUT" : "POST", // S3 uses PUT, Supabase native uses POST
      // Storage configuration info
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      bucket: process.env.SUPABASE_STORAGE_BUCKET || "uploads",
      apiType: useS3API ? "s3-compatible" : "supabase-native",
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/upload/presign error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

