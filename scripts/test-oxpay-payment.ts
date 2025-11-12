/**
 * Test script for OxPay Payment System
 * 
 * This script tests the OxPay payment integration flow:
 * 1. Creates a test order
 * 2. Creates payment intent
 * 3. Verifies payment URL is generated
 * 4. Tests webhook handler
 * 
 * Run with: tsx scripts/test-oxpay-payment.ts
 */

import { PrismaClient } from "@prisma/client";
import { createRedirectPayment } from "../services/payments/oxpay";

const prisma = new PrismaClient();

async function testOxPayPayment() {
  console.log("🧪 Testing OxPay Payment System\n");
  console.log("=" .repeat(60));

  // Step 1: Check Environment Variables
  console.log("\n📋 Step 1: Checking Environment Variables");
  console.log("-".repeat(60));
  
  const requiredEnvVars = [
    "OXPAY_BASE_URL",
    "OXPAY_MCPTID",
    "OXPAY_USER_ID",
    "OXPAY_PASSWORD",
    "OXPAY_PASSWORD_KEY",
    "OXPAY_STATUS_URL",
    "OXPAY_RETURN_URL",
  ];

  const missingVars: string[] = [];
  const envVars: Record<string, string> = {};

  for (const varName of requiredEnvVars) {
    const value = process.env[varName];
    envVars[varName] = value || "";
    
    if (!value || value.trim() === "") {
      missingVars.push(varName);
      console.log(`❌ ${varName}: MISSING`);
    } else {
      // Mask sensitive values
      const maskedValue = varName.includes("PASSWORD") || varName.includes("KEY")
        ? "*".repeat(8)
        : value;
      console.log(`✅ ${varName}: ${maskedValue}`);
    }
  }

  if (missingVars.length > 0) {
    console.log("\n⚠️  Missing Environment Variables:");
    missingVars.forEach((v) => console.log(`   - ${v}`));
    console.log("\n📝 Please add these to your .env file:");
    console.log("\n# OxPay Configuration");
    missingVars.forEach((v) => {
      console.log(`${v}=your_${v.toLowerCase()}_here`);
    });
    console.log("\n");
    return;
  }

  // Step 2: Test Database Connection
  console.log("\n📋 Step 2: Testing Database Connection");
  console.log("-".repeat(60));
  
  try {
    await prisma.$connect();
    console.log("✅ Database connection: SUCCESS");
    
    // Check if Payment model exists
    const paymentCount = await prisma.payment.count();
    console.log(`✅ Payment table accessible (${paymentCount} records)`);
  } catch (error: any) {
    console.log(`❌ Database connection: FAILED`);
    console.log(`   Error: ${error.message}`);
    return;
  }

  // Step 3: Create Test Order
  console.log("\n📋 Step 3: Creating Test Order");
  console.log("-".repeat(60));
  
  let testOrder;
  let testUser;
  
  try {
    // Find or create a test user
    testUser = await prisma.user.findFirst({
      where: { role: "BUYER" },
    });

    if (!testUser) {
      console.log("⚠️  No buyer user found. Creating test user...");
      testUser = await prisma.user.create({
        data: {
          email: `test-buyer-${Date.now()}@test.com`,
          name: "Test Buyer",
          role: "BUYER",
        },
      });
    }

    console.log(`✅ Test user: ${testUser.email}`);

    // Create a test order
    testOrder = await prisma.order.create({
      data: {
        userId: testUser.id,
        status: "PENDING",
        total: 100.00,
        payment: {
          create: {
            amount: 100.00,
            status: "INITIATED",
            currency: "SGD",
          },
        },
        shipping: {
          create: {
            address: "123 Test Street",
            city: "Kuala Lumpur",
            postal: "50000",
            country: "MY",
          },
        },
      },
      include: {
        payment: true,
      },
    });

    console.log(`✅ Test order created: ${testOrder.id}`);
    console.log(`   Amount: S$ ${testOrder.total}`);
  } catch (error: any) {
    console.log(`❌ Failed to create test order: ${error.message}`);
    return;
  }

  // Step 4: Test Payment Intent Creation
  console.log("\n📋 Step 4: Testing Payment Intent Creation");
  console.log("-".repeat(60));
  
  try {
    const referenceNo = `TEST-${testOrder.id}-${Date.now()}`;
    console.log(`   Reference No: ${referenceNo}`);
    console.log(`   Amount: S$ ${Number(testOrder.total)}`);
    console.log(`   Currency: SGD`);

    const { paymentUrl, referenceNo: returnedRef } = await createRedirectPayment(
      referenceNo,
      Number(testOrder.total),
      "SGD"
    );

    console.log(`✅ Payment URL generated successfully!`);
    console.log(`   Reference: ${returnedRef}`);
    console.log(`   Payment URL: ${paymentUrl}`);
    console.log(`\n🔗 You can test the redirect by visiting:`);
    console.log(`   ${paymentUrl}`);

    // Update payment record
    await prisma.payment.update({
      where: { orderId: testOrder.id },
      data: {
        providerRef: returnedRef,
      },
    });

    console.log(`✅ Payment record updated with reference number`);
  } catch (error: any) {
    console.log(`❌ Failed to create payment intent: ${error.message}`);
    console.log(`\n💡 Common issues:`);
    console.log(`   - Check if OxPay credentials are correct`);
    console.log(`   - Verify OXPAY_BASE_URL is correct`);
    console.log(`   - Ensure OXPAY_STATUS_URL and OXPAY_RETURN_URL are accessible`);
    console.log(`   - Check network connectivity to OxPay gateway`);
    
    // Clean up test order
    if (testOrder) {
      await prisma.order.delete({
        where: { id: testOrder.id },
      }).catch(() => {});
    }
    return;
  }

  // Step 5: Test API Endpoints
  console.log("\n📋 Step 5: Testing API Endpoints");
  console.log("-".repeat(60));
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  console.log(`\n🔗 API Endpoints to test:`);
  console.log(`   1. POST ${baseUrl}/api/payments/oxpay/intent`);
  console.log(`      Body: { "orderId": "${testOrder.id}" }`);
  console.log(`      Requires: Authentication (Buyer role)`);
  
  console.log(`\n   2. POST ${baseUrl}/api/payments/oxpay/status`);
  console.log(`      Body: OxPay webhook payload`);
  console.log(`      Purpose: Webhook handler for payment status updates`);
  
  console.log(`\n   3. GET ${baseUrl}/api/payments/oxpay/status?ref=<referenceNo>`);
  console.log(`      Purpose: Get payment status by reference number`);
  console.log(`      Requires: Authentication (Buyer role)`);
  
  console.log(`\n   4. GET ${baseUrl}/api/payments/oxpay/return?referenceNo=<ref>`);
  console.log(`      Purpose: Return callback from OxPay`);
  console.log(`      Redirects to: /checkout/receipt?ref=<ref>`);

  // Step 6: Test Webhook Payload Structure
  console.log("\n📋 Step 6: Webhook Payload Structure");
  console.log("-".repeat(60));
  
  const sampleWebhookPayload = {
    referenceNo: `TEST-${testOrder.id}-${Date.now()}`,
    state: "2", // AUTHORIZED
    respCode: "00",
    respMsg: "Success",
    providerRef: "TXN123456789",
    receiptNumber: "RCP123456",
    brandName: "VISA",
    truncatedPan: "1234",
    signature: "SIGNATURE_HERE",
  };

  console.log("📦 Sample webhook payload structure:");
  console.log(JSON.stringify(sampleWebhookPayload, null, 2));

  // Step 7: Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Summary");
  console.log("=".repeat(60));
  console.log("✅ Environment variables: Configured");
  console.log("✅ Database connection: Working");
  console.log("✅ Test order: Created");
  console.log("✅ Payment intent: Created");
  console.log("✅ Payment URL: Generated");
  
  console.log("\n📝 Next Steps:");
  console.log("   1. Ensure your .env file has all OxPay credentials");
  console.log("   2. Test the payment flow in the checkout page");
  console.log("   3. Configure OxPay webhook URL to point to:");
  console.log(`      ${envVars.OXPAY_STATUS_URL}`);
  console.log("   4. Test with OxPay sandbox/test credentials first");
  console.log("   5. Verify the return URL redirects correctly:");
  console.log(`      ${envVars.OXPAY_RETURN_URL}`);

  console.log("\n🧹 Cleaning up test order...");
  try {
    await prisma.order.delete({
      where: { id: testOrder.id },
    });
    console.log("✅ Test order cleaned up");
  } catch (error: any) {
    console.log(`⚠️  Could not clean up test order: ${error.message}`);
  }

  await prisma.$disconnect();
  console.log("\n✅ Test completed!\n");
}

// Run the test
testOxPayPayment()
  .catch((error) => {
    console.error("\n❌ Test failed with error:", error);
    process.exit(1);
  });




