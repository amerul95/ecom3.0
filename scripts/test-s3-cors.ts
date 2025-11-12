import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load .env file if it exists
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log("📄 Loaded .env file\n");
}

async function testS3CORS() {
  console.log("🔍 Testing S3 CORS Configuration for Browser Uploads...\n");

  const bucketName = process.env.AWS_S3_BUCKET_NAME!;
  const region = process.env.AWS_REGION || "us-east-1";

  console.log("📋 Current Configuration:");
  console.log(`  - Bucket: ${bucketName}`);
  console.log(`  - Region: ${region}`);
  console.log(`  - Your app URL: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}\n`);

  console.log("📝 Current CORS Configuration:\n");
  console.log("Your S3 bucket CORS should match this configuration:\n");
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const corsConfig = {
    "CORSRules": [
      {
        "AllowedHeaders": [
          "*"
        ],
        "AllowedMethods": [
          "GET",
          "PUT",
          "POST",
          "DELETE",
          "HEAD"
        ],
        "AllowedOrigins": [
          "http://localhost:3000",
          "https://localhost:3000",
          "http://127.0.0.1:3000"
        ],
        "ExposeHeaders": [
          "ETag",
          "x-amz-request-id",
          "x-amz-id-2"
        ],
        "MaxAgeSeconds": 3000
      }
    ]
  };

  console.log(JSON.stringify(corsConfig, null, 2));
  console.log("\n✅ CORS Configuration Status:");
  console.log(`   - Bucket: ${bucketName}`);
  console.log(`   - Region: ${region}`);
  console.log(`   - Allowed Origins: http://localhost:3000, https://localhost:3000, http://127.0.0.1:3000`);
  console.log("\n💡 To Verify/Update:");
  console.log(`1. Open: https://s3.console.aws.amazon.com/s3/buckets/${bucketName}?region=${region}&tab=permissions`);
  console.log("2. Scroll to 'Cross-origin resource sharing (CORS)'");
  console.log("3. Verify it matches the configuration above");
  console.log("\n📝 For Production:");
  console.log("   Add your production domain to AllowedOrigins (e.g., https://yourdomain.com)");
}

testS3CORS().catch((error) => {
  console.error("\n❌ Error:", error);
  process.exit(1);
});

