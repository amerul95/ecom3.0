import { S3Client, ListBucketsCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load .env file if it exists
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log("📄 Loaded .env file\n");
} else {
  console.log("⚠️  No .env file found. Loading from environment variables.\n");
}

async function testS3Connection() {
  console.log("🔍 Testing AWS S3 Connection...\n");

  // Check environment variables
  const requiredEnvVars = [
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_REGION",
    "AWS_S3_BUCKET_NAME",
  ];

  console.log("📋 Checking Environment Variables:");
  const missingVars: string[] = [];
  
  for (const varName of requiredEnvVars) {
    const value = process.env[varName];
    if (!value) {
      missingVars.push(varName);
      console.log(`  ❌ ${varName}: NOT SET`);
    } else {
      // Mask sensitive values
      const displayValue = varName.includes("SECRET") || varName.includes("KEY")
        ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
        : value;
      console.log(`  ✅ ${varName}: ${displayValue}`);
    }
  }

  if (missingVars.length > 0) {
    console.log("\n❌ Missing required environment variables!");
    console.log("\n📝 Please create a .env file in the project root with:");
    console.log("```env");
    console.log("# AWS S3 Configuration");
    missingVars.forEach((v) => {
      if (v === "AWS_REGION") {
        console.log(`${v}=us-east-1`);
      } else if (v === "AWS_S3_BUCKET_NAME") {
        console.log(`${v}=your-bucket-name`);
      } else {
        console.log(`${v}=your-${v.toLowerCase().replace(/_/g, "-")}`);
      }
    });
    console.log("```");
    console.log("\n💡 How to get AWS credentials:");
    console.log("  1. Go to AWS Console → IAM → Users");
    console.log("  2. Create a user with S3 permissions");
    console.log("  3. Create access keys for the user");
    console.log("  4. Copy the Access Key ID and Secret Access Key");
    console.log("  5. Create an S3 bucket in your preferred region");
    process.exit(1);
  }

  // Initialize S3 Client
  console.log("\n🔧 Initializing S3 Client...");
  const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  // Test 1: List buckets (tests credentials)
  console.log("\n📦 Test 1: Listing buckets (testing credentials)...");
  try {
    const listCommand = new ListBucketsCommand({});
    const response = await s3Client.send(listCommand);
    
    if (response.Buckets) {
      console.log(`  ✅ Successfully connected! Found ${response.Buckets.length} bucket(s):`);
      response.Buckets.forEach((bucket) => {
        const isTarget = bucket.Name === process.env.AWS_S3_BUCKET_NAME;
        console.log(`    ${isTarget ? "🎯" : "  "} ${bucket.Name}${isTarget ? " (TARGET)" : ""}`);
      });
    }
  } catch (error: any) {
    console.log(`  ❌ Failed to list buckets: ${error.message}`);
    console.log(`  Error Code: ${error.Code || error.name}`);
    if (error.Code === "InvalidAccessKeyId" || error.Code === "SignatureDoesNotMatch") {
      console.log("  💡 Check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY");
    }
    process.exit(1);
  }

  // Test 2: Check if target bucket exists and is accessible
  const bucketName = process.env.AWS_S3_BUCKET_NAME!;
  console.log(`\n🎯 Test 2: Checking bucket access (${bucketName})...`);
  try {
    const headCommand = new HeadBucketCommand({ Bucket: bucketName });
    await s3Client.send(headCommand);
    console.log(`  ✅ Bucket "${bucketName}" exists and is accessible!`);
  } catch (error: any) {
    console.log(`  ❌ Failed to access bucket: ${error.message}`);
    console.log(`  Error Code: ${error.Code || error.name}`);
    
    if (error.Code === "NotFound" || error.name === "NotFound") {
      console.log(`  💡 Bucket "${bucketName}" does not exist. Please create it in AWS S3.`);
    } else if (error.Code === "403" || error.name === "Forbidden") {
      console.log(`  💡 Access denied. Check your IAM permissions for bucket "${bucketName}"`);
    }
    process.exit(1);
  }

  // Test 3: Check bucket region
  console.log(`\n🌍 Test 3: Verifying bucket region...`);
  try {
    // Try to get bucket location
    const { GetBucketLocationCommand } = await import("@aws-sdk/client-s3");
    const locationCommand = new GetBucketLocationCommand({ Bucket: bucketName });
    const locationResponse = await s3Client.send(locationCommand);
    const bucketRegion = locationResponse.LocationConstraint || "us-east-1";
    
    const configuredRegion = process.env.AWS_REGION!;
    if (bucketRegion === configuredRegion || (bucketRegion === null && configuredRegion === "us-east-1")) {
      console.log(`  ✅ Bucket region matches configuration (${configuredRegion})`);
    } else {
      console.log(`  ⚠️  Warning: Bucket region (${bucketRegion}) differs from configured region (${configuredRegion})`);
      console.log(`  💡 Consider updating AWS_REGION to match bucket region for better performance`);
    }
  } catch (error: any) {
    console.log(`  ⚠️  Could not verify bucket region: ${error.message}`);
  }

  // Test 4: Test presigned URL generation (the actual function we use)
  console.log(`\n🔗 Test 4: Testing presigned URL generation...`);
  try {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    
    const testKey = `test-connection-${Date.now()}.txt`;
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      ContentType: "text/plain",
    });
    
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    if (presignedUrl && presignedUrl.includes(bucketName)) {
      console.log(`  ✅ Successfully generated presigned URL!`);
      console.log(`  📝 Test key: ${testKey}`);
      console.log(`  🔗 URL preview: ${presignedUrl.substring(0, 80)}...`);
    } else {
      console.log(`  ❌ Presigned URL generation failed`);
      process.exit(1);
    }
  } catch (error: any) {
    console.log(`  ❌ Failed to generate presigned URL: ${error.message}`);
    process.exit(1);
  }

  console.log("\n✅ All S3 connection tests passed!");
  console.log("\n📝 Summary:");
  console.log(`  - Region: ${process.env.AWS_REGION}`);
  console.log(`  - Bucket: ${bucketName}`);
  console.log(`  - Credentials: Valid`);
  console.log(`  - Access: Confirmed`);
  console.log("\n🎉 Your S3 connection is ready to use!");
}

testS3Connection().catch((error) => {
  console.error("\n❌ Unexpected error:", error);
  process.exit(1);
});

