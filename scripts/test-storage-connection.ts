import { config } from "dotenv";
import { testStorageConnection } from "../lib/storage";

// Load environment variables
config();

async function testConnection() {
  console.log("🔍 Testing Supabase Storage Connection...\n");
  
  // Display configuration
  console.log("Configuration:");
  console.log(`  - Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || "NOT SET"}`);
  console.log(`  - Storage Bucket: ${process.env.SUPABASE_STORAGE_BUCKET || "NOT SET"}`);
  console.log(`  - S3 Endpoint: ${process.env.SUPABASE_S3_ENDPOINT || "NOT SET"}`);
  console.log(`  - S3 Access Key ID: ${process.env.SUPABASE_S3_ACCESS_KEY_ID ? "***SET***" : "NOT SET"}`);
  console.log(`  - S3 Secret Key: ${process.env.SUPABASE_S3_SECRET_ACCESS_KEY ? "***SET***" : "NOT SET"}`);
  console.log(`  - S3 Region: ${process.env.SUPABASE_S3_REGION || "NOT SET"}`);
  console.log(`  - Service Role Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? "***SET***" : "NOT SET"}`);
  console.log(`  - Anon Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "***SET***" : "NOT SET"}`);
  console.log("");

  // Check S3 config
  const hasS3Config = !!(process.env.SUPABASE_S3_ENDPOINT && 
                         process.env.SUPABASE_S3_ACCESS_KEY_ID && 
                         process.env.SUPABASE_S3_SECRET_ACCESS_KEY);
  console.log(`S3-compatible API: ${hasS3Config ? "✅ Configured" : "❌ Not configured"}`);
  console.log(`Supabase Native API: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Configured" : "❌ Not configured"}`);
  console.log("");

  try {
    const result = await testStorageConnection();
    
    if (result.success) {
      console.log("✅ Storage connection successful!");
      console.log(`   Method: ${result.details?.method || "Unknown"}`);
      console.log(`   Bucket: ${result.details?.bucket || "Unknown"}`);
      if (result.details?.endpoint) {
        console.log(`   Endpoint: ${result.details.endpoint}`);
      }
      if (result.details?.region) {
        console.log(`   Region: ${result.details.region}`);
      }
      if (result.details?.supabaseUrl) {
        console.log(`   Supabase URL: ${result.details.supabaseUrl}`);
      }
    } else {
      console.log("❌ Storage connection failed!");
      console.log(`   Error: ${result.message}`);
      if (result.details) {
        console.log("   Details:", JSON.stringify(result.details, null, 2));
      }
      process.exit(1);
    }
  } catch (error: any) {
    console.error("❌ Unexpected error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testConnection();
