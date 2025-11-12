/**
 * Test database connection script
 * Run with: npx tsx scripts/test-db-connection.ts
 */

import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

// Load .env file
config();

const prisma = new PrismaClient({
  log: ["query", "error", "warn"],
});

async function testConnection() {
  try {
    console.log("🔍 Testing database connection...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@"));
    
    // Test connection
    await prisma.$connect();
    console.log("✅ Database connection successful!");
    
    // Test query
    const userCount = await prisma.user.count();
    console.log(`📊 Users in database: ${userCount}`);
    
    const productCount = await prisma.product.count();
    console.log(`📊 Products in database: ${productCount}`);
    
    // Check if tables exist
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;
    
    console.log(`\n📋 Tables in database (${tables.length}):`);
    tables.forEach((table) => {
      console.log(`   - ${table.tablename}`);
    });
    
  } catch (error: any) {
    console.error("❌ Database connection failed!");
    console.error("Error:", error.message);
    
    if (error.code === "P1000") {
      console.error("\n💡 Possible issues:");
      console.error("   1. PostgreSQL server is not running");
      console.error("   2. Database credentials are incorrect");
      console.error("   3. Database 'ecommerceV' does not exist");
      console.error("   4. User 'ecommerce' does not exist or wrong password");
    } else if (error.code === "ECONNREFUSED") {
      console.error("\n💡 PostgreSQL server is not running or not accessible");
      console.error("   Start PostgreSQL service or check if it's running on port 5432");
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

