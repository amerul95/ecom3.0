/**
 * Test script for OxPay Payment System (Hosted Payment Page)
 *
 * Run with: tsx scripts/test-oxpay-payment.ts
 */

import { PrismaClient } from "@prisma/client";
import { createHostedPaymentPage } from "@/Payment/handler/OxpayHandler";

const prisma = new PrismaClient();

async function testOxPayPayment() {
  console.log("🧪 Testing OxPay Payment System (HPP)\n");
  console.log("=".repeat(60));

  // Step 1: Check Environment Variables
  console.log("\n📋 Step 1: Checking Environment Variables");
  console.log("-".repeat(60));

  const requiredEnvVars = [
    "OXPAY_BASE_URL",
    "OXPAY_API_KEY",
    "OXPAY_SIGN_KEY",
    "OXPAY_MERCHANT_ID",
    "OXPAY_TERMINAL_ID",
  ];

  const missingVars: string[] = [];
  for (const varName of requiredEnvVars) {
    const value = process.env[varName];
    if (!value || value.trim() === "") {
      missingVars.push(varName);
      console.log(`❌ ${varName}: MISSING`);
    } else {
      const masked = varName.includes("KEY") || varName.includes("API") ? "*".repeat(8) : value;
      console.log(`✅ ${varName}: ${masked}`);
    }
  }

  if (missingVars.length > 0) {
    console.log("\n⚠️  Missing:", missingVars.join(", "));
    return;
  }

  // Step 2: Test Database
  console.log("\n📋 Step 2: Database");
  console.log("-".repeat(60));
  try {
    await prisma.$connect();
    console.log("✅ Database: OK");
  } catch (e: any) {
    console.log("❌ Database:", e.message);
    return;
  }

  // Step 3: Create Test Order
  console.log("\n📋 Step 3: Test Order");
  console.log("-".repeat(60));
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  let testOrder: { id: string; total: { toString: () => string } } | null = null;
  let testUser: { id: string; email: string; name: string | null } | null = null;

  try {
    testUser = await prisma.user.findFirst({ where: { role: "BUYER" } });
    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: `test-buyer-${Date.now()}@test.com`,
          name: "Test Buyer",
          role: "BUYER",
        },
      }) as typeof testUser;
    }
    testOrder = await prisma.order.create({
      data: {
        userId: testUser.id,
        status: "PENDING",
        total: 100.0,
        payment: {
          create: { amount: 100.0, status: "INITIATED", currency: "SGD" },
        },
        shipping: {
          create: {
            address: "123 Test Street",
            city: "Kuala Lumpur",
            postal: "50000",
            country: "SG",
          },
        },
      },
      include: { payment: true },
    }) as unknown as typeof testOrder;
    console.log(`✅ Order: ${testOrder.id}, S$ ${testOrder.total.toString()}`);
  } catch (e: any) {
    console.log("❌ Order:", e.message);
    return;
  }

  // Step 4: Create Hosted Payment Page
  console.log("\n📋 Step 4: Hosted Payment Page");
  console.log("-".repeat(60));
  try {
    const { hppUrl, sessionId } = await createHostedPaymentPage({
      merchantReferenceId: testOrder.id,
      description: `Test order ${testOrder.id}`,
      amount: Number(testOrder.total.toString()),
      currency: "SGD",
      successUrl: `${baseUrl}/api/payments/oxpay-v2/return?status=success`,
      failureUrl: `${baseUrl}/api/payments/oxpay-v2/return?status=failure`,
      notificationUrl: `${baseUrl}/api/payments/oxpay-v2/webhook`,
      payerName: testUser.name || "Test",
      payerEmail: testUser.email,
      payerPhone: "12345678",
    });
    console.log("✅ HPP URL generated");
    console.log(`   URL: ${hppUrl?.substring(0, 60)}...`);
    if (sessionId) console.log(`   Session: ${sessionId}`);
  } catch (e: any) {
    console.log("❌ HPP:", e.message);
    await prisma.order.delete({ where: { id: testOrder!.id } }).catch(() => {});
    return;
  }

  // Summary
  console.log("\n📋 API Endpoints");
  console.log("-".repeat(60));
  console.log(`   POST ${baseUrl}/api/payments/oxpay-v2/intent`);
  console.log(`   GET  ${baseUrl}/api/payments/oxpay-v2/status?ref=<orderId>`);
  console.log(`   POST ${baseUrl}/api/payments/oxpay-v2/webhook`);

  await prisma.order.delete({ where: { id: testOrder.id } }).catch(() => {});
  await prisma.$disconnect();
  console.log("\n✅ Test completed\n");
}

testOxPayPayment().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
