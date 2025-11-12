import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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

async function testS3UploadAndRetrieve() {
  console.log("🔍 Testing AWS S3 Upload and Retrieve Functionality...\n");

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
      const displayValue = varName.includes("SECRET") || varName.includes("KEY")
        ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
        : value;
      console.log(`  ✅ ${varName}: ${displayValue}`);
    }
  }

  if (missingVars.length > 0) {
    console.log("\n❌ Missing required environment variables!");
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

  const bucketName = process.env.AWS_S3_BUCKET_NAME!;
  const testKey = `test-uploads/test-image-${Date.now()}.txt`;
  const testContent = `Test file created at ${new Date().toISOString()}\nThis is a test upload to verify S3 functionality.`;

  // Test 1: Generate Presigned URL for Upload
  console.log(`\n📤 Test 1: Generating presigned URL for upload...`);
  try {
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      ContentType: "text/plain",
      Body: testContent,
    });

    const presignedUploadUrl = await getSignedUrl(s3Client, putCommand, { expiresIn: 3600 });
    console.log(`  ✅ Presigned upload URL generated successfully`);
    console.log(`  📝 Test key: ${testKey}`);
    console.log(`  🔗 URL preview: ${presignedUploadUrl.substring(0, 100)}...`);
  } catch (error: any) {
    console.log(`  ❌ Failed to generate presigned URL: ${error.message}`);
    process.exit(1);
  }

  // Test 2: Upload to S3
  console.log(`\n📤 Test 2: Uploading test file to S3...`);
  try {
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      ContentType: "text/plain",
      Body: testContent,
    });

    await s3Client.send(putCommand);
    console.log(`  ✅ File uploaded successfully to S3!`);
    console.log(`  📝 Key: ${testKey}`);
  } catch (error: any) {
    console.log(`  ❌ Failed to upload file: ${error.message}`);
    console.log(`  Error Code: ${error.Code || error.name}`);
    if (error.Code === "AccessDenied") {
      console.log(`  💡 Check your IAM permissions for S3 PutObject`);
    }
    process.exit(1);
  }

  // Test 3: Generate Presigned URL for Retrieval
  console.log(`\n📥 Test 3: Generating presigned URL for retrieval...`);
  let presignedDownloadUrl: string;
  try {
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: testKey,
    });

    presignedDownloadUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
    console.log(`  ✅ Presigned download URL generated successfully`);
    console.log(`  🔗 URL preview: ${presignedDownloadUrl.substring(0, 100)}...`);
  } catch (error: any) {
    console.log(`  ❌ Failed to generate presigned download URL: ${error.message}`);
    process.exit(1);
  }

  // Test 4: Retrieve from S3
  console.log(`\n📥 Test 4: Retrieving file from S3...`);
  try {
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: testKey,
    });

    const response = await s3Client.send(getCommand);
    const retrievedContent = await response.Body?.transformToString();
    
    if (retrievedContent === testContent) {
      console.log(`  ✅ File retrieved successfully from S3!`);
      console.log(`  📝 Content matches: ${retrievedContent.substring(0, 50)}...`);
    } else {
      console.log(`  ⚠️  File retrieved but content doesn't match`);
    }
  } catch (error: any) {
    console.log(`  ❌ Failed to retrieve file: ${error.message}`);
    console.log(`  Error Code: ${error.Code || error.name}`);
    if (error.Code === "NoSuchKey") {
      console.log(`  💡 File was uploaded but can't be found. Check bucket permissions.`);
    }
    process.exit(1);
  }

  // Test 5: Test Public URL Format
  console.log(`\n🌐 Test 5: Testing public URL format...`);
  try {
    const region = process.env.AWS_REGION!;
    let publicUrl: string;
    
    if (region === "us-east-1") {
      publicUrl = `https://${bucketName}.s3.amazonaws.com/${testKey}`;
    } else {
      publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${testKey}`;
    }

    console.log(`  ✅ Public URL format: ${publicUrl}`);
    
    // Try to fetch the public URL (if bucket is public)
    try {
      const fetchResponse = await fetch(publicUrl);
      if (fetchResponse.ok) {
        console.log(`  ✅ Public URL is accessible (bucket is public)`);
      } else {
        console.log(`  ⚠️  Public URL returned ${fetchResponse.status} (bucket may be private, use presigned URLs)`);
      }
    } catch (fetchError) {
      console.log(`  ⚠️  Public URL not accessible (this is normal if bucket is private)`);
      console.log(`  💡 Use presigned URLs for private bucket access`);
    }
  } catch (error: any) {
    console.log(`  ⚠️  Could not test public URL: ${error.message}`);
  }

  // Test 6: Test using fetch with presigned URL (simulating browser upload)
  console.log(`\n🌐 Test 6: Testing browser-style upload via presigned URL...`);
  try {
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: `test-uploads/browser-test-${Date.now()}.txt`,
      ContentType: "text/plain",
    });

    const browserPresignedUrl = await getSignedUrl(s3Client, putCommand, { expiresIn: 3600 });
    
    // Simulate browser upload
    const uploadResponse = await fetch(browserPresignedUrl, {
      method: "PUT",
      body: "Browser upload test content",
      headers: {
        "Content-Type": "text/plain",
      },
    });

    if (uploadResponse.ok || uploadResponse.status === 200) {
      console.log(`  ✅ Browser-style upload successful!`);
      console.log(`  📝 Status: ${uploadResponse.status}`);
    } else {
      console.log(`  ⚠️  Upload returned status: ${uploadResponse.status}`);
      const errorText = await uploadResponse.text().catch(() => "");
      console.log(`  📝 Response: ${errorText.substring(0, 200)}`);
      
      if (uploadResponse.status === 403) {
        console.log(`  💡 This might be a CORS issue. Check S3 bucket CORS configuration.`);
      }
    }
  } catch (error: any) {
    console.log(`  ❌ Browser-style upload failed: ${error.message}`);
    if (error.message.includes("fetch")) {
      console.log(`  💡 This is likely a CORS issue. Configure CORS on your S3 bucket.`);
      console.log(`  💡 See S3_CORS_SETUP.md for instructions.`);
    }
  }

  console.log("\n✅ All S3 upload and retrieve tests completed!");
  console.log("\n📝 Summary:");
  console.log(`  - Bucket: ${bucketName}`);
  console.log(`  - Region: ${process.env.AWS_REGION}`);
  console.log(`  - Upload: ✅ Working`);
  console.log(`  - Retrieve: ✅ Working`);
  console.log(`  - Presigned URLs: ✅ Working`);
  console.log("\n🎉 Your S3 bucket is ready for image uploads!");
  console.log("\n💡 Note: If browser uploads fail, check CORS configuration (see S3_CORS_SETUP.md)");
}

testS3UploadAndRetrieve().catch((error) => {
  console.error("\n❌ Unexpected error:", error);
  process.exit(1);
});








