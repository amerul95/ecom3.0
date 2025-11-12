import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getPresignedPostUrl, getS3PublicUrl } from "@/lib/s3";
import { uploadSchema } from "@/lib/validations";
import { z } from "zod";
import { randomUUID } from "crypto";

// POST /api/upload/presign - Get presigned URL for S3 upload
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(); // Must be authenticated

    const body = await request.json();
    const { filename, contentType } = uploadSchema.parse(body);

    // Generate unique key: uploads/{userId}/{uuid}-{filename}
    const extension = filename.split(".").pop() || "jpg";
    const key = `uploads/${user.id}/${randomUUID()}.${extension}`;

    const presignedUrl = await getPresignedPostUrl(key, contentType);
    const publicUrl = getS3PublicUrl(key);

    return NextResponse.json({
      presignedUrl,
      key,
      publicUrl,
      method: "PUT",
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

