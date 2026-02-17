import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Delete all existing users (this will cascade delete related data)
  console.log("🗑️  Deleting all existing users...");
  await prisma.user.deleteMany({});
  console.log("✅ Deleted all users");

  // Create test user with ADMIN role (ADMIN can do everything BUYER can do)
  const testPassword = await bcrypt.hash("Senario@123", 10);
  const testUser = await prisma.user.create({
    data: {
      email: "test@test.com",
      name: "Test User",
      password: testPassword,
      role: Role.ADMIN,
      storeName: "Test Store",
      verified: true,
      emailVerified: new Date(),
    },
  });
  console.log("✅ Created test user:", testUser.email, "with ADMIN role");

  // Create categories
  const electronicsCategory = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: {},
    create: {
      name: "Electronics",
      slug: "electronics",
    },
  });

  const apparelCategory = await prisma.category.upsert({
    where: { slug: "apparel" },
    update: {},
    create: {
      name: "Apparel",
      slug: "apparel",
    },
  });

  const accessoriesCategory = await prisma.category.upsert({
    where: { slug: "accessories" },
    update: {},
    create: {
      name: "Accessories",
      slug: "accessories",
    },
  });

  console.log("✅ Created categories");

  // Create sample products
  const products = [
    {
      name: "Premium Coffee Mug",
      slug: "premium-coffee-mug",
      description: "High-quality ceramic coffee mug with premium finish",
      price: 29.99,
      stock: 50,
      images: [],
      sellerId: testUser.id,
      categoryId: accessoriesCategory.id,
    },
    {
      name: "Cotton T-Shirt",
      slug: "cotton-t-shirt",
      description: "Comfortable 100% cotton t-shirt in various colors",
      price: 24.99,
      stock: 100,
      images: [],
      sellerId: testUser.id,
      categoryId: apparelCategory.id,
    },
    {
      name: "Wireless Headphones",
      slug: "wireless-headphones",
      description: "Premium wireless headphones with noise cancellation",
      price: 149.99,
      stock: 30,
      images: [],
      sellerId: testUser.id,
      categoryId: electronicsCategory.id,
    },
    {
      name: "Leather Wallet",
      slug: "leather-wallet",
      description: "Genuine leather wallet with multiple card slots",
      price: 49.99,
      stock: 75,
      images: [],
      sellerId: testUser.id,
      categoryId: accessoriesCategory.id,
    },
  ];

  for (const productData of products) {
    const product = await prisma.product.create({
      data: productData,
    });
    console.log(`✅ Created product: ${product.name}`);
  }

  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

