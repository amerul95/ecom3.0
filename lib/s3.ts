import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export async function getPresignedPostUrl(
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
  return url;
}

export function getS3PublicUrl(key: string): string {
  const region = process.env.AWS_REGION || "us-east-1";
  const bucketName = BUCKET_NAME;
  
  // Handle different S3 URL formats based on region
  // For us-east-1, the format is different (no region in URL)
  if (region === "us-east-1") {
    return `https://${bucketName}.s3.amazonaws.com/${key}`;
  }
  
  // For other regions, include region in URL
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Test S3 connection and configuration
 * Can be called from API route for diagnostics
 */
export async function testS3Connection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    // Check if required env vars are set
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !BUCKET_NAME) {
      return {
        success: false,
        message: "Missing AWS S3 configuration",
      };
    }

    // Test by trying to generate a presigned URL
    const testKey = `test-${Date.now()}.txt`;
    await getPresignedPostUrl(testKey, "text/plain");

    return {
      success: true,
      message: "S3 connection successful",
      details: {
        region: process.env.AWS_REGION || "us-east-1",
        bucket: BUCKET_NAME,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: `S3 connection failed: ${error.message}`,
      details: {
        error: error.name || error.Code,
      },
    };
  }
}



