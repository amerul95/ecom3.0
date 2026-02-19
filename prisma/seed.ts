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
  const apparelCategory = await prisma.category.upsert({
    where: { slug: "apparel" },
    update: {},
    create: { name: "Apparel", slug: "apparel" },
  });

  const electronicsCategory = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: {},
    create: { name: "Electronics", slug: "electronics" },
  });

  const drinkwareCategory = await prisma.category.upsert({
    where: { slug: "drinkware" },
    update: {},
    create: { name: "Drinkware", slug: "drinkware" },
  });

  const bagsCategory = await prisma.category.upsert({
    where: { slug: "bags" },
    update: {},
    create: { name: "Bags", slug: "bags" },
  });

  const accessoriesCategory = await prisma.category.upsert({
    where: { slug: "accessories" },
    update: {},
    create: { name: "Accessories", slug: "accessories" },
  });

  console.log("✅ Created categories");

  // Create sample products
  const products = [
    // Apparel
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
    // Electronics
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
    // Accessories
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
    {
      name: "Portable Bluetooth Speaker",
      slug: "portable-bluetooth-speaker",
      description: "Water-resistant wireless speaker with 12-hour battery life",
      price: 79.99,
      stock: 45,
      images: [],
      sellerId: testUser.id,
      categoryId: electronicsCategory.id,
    },
    {
      name: "USB-C Fast Charging Cable",
      slug: "usbc-fast-charging-cable",
      description: "Durable braided cable, 6ft length, supports 100W charging",
      price: 14.99,
      stock: 200,
      images: [],
      sellerId: testUser.id,
      categoryId: electronicsCategory.id,
    },
    {
      name: "Smart Watch Pro",
      slug: "smart-watch-pro",
      description: "Fitness tracking, heart rate monitor, GPS, 7-day battery",
      price: 199.99,
      stock: 25,
      images: [],
      sellerId: testUser.id,
      categoryId: electronicsCategory.id,
    },
    // Apparel (continued)
    {
      name: "Classic Denim Jacket",
      slug: "classic-denim-jacket",
      description: "Timeless vintage wash denim jacket, unisex fit",
      price: 89.99,
      stock: 40,
      images: [],
      sellerId: testUser.id,
      categoryId: apparelCategory.id,
    },
    {
      name: "Lightweight Running Shorts",
      slug: "lightweight-running-shorts",
      description: "Moisture-wicking fabric, reflective trim, 5-inch inseam",
      price: 34.99,
      stock: 80,
      images: [],
      sellerId: testUser.id,
      categoryId: apparelCategory.id,
    },
    {
      name: "Fleece Hoodie",
      slug: "fleece-hoodie",
      description: "Soft brushed fleece, kangaroo pocket, relaxed fit",
      price: 59.99,
      stock: 55,
      images: [],
      sellerId: testUser.id,
      categoryId: apparelCategory.id,
    },
    // Bags
    {
      name: "Canvas Crossbody Bag",
      slug: "canvas-crossbody-bag",
      description: "Compact canvas bag with adjustable strap, multiple pockets",
      price: 39.99,
      stock: 60,
      images: [],
      sellerId: testUser.id,
      categoryId: bagsCategory.id,
    },
    {
      name: "Leather Tote Bag",
      slug: "leather-tote-bag",
      description: "Spacious vegan leather tote, laptop compartment, top zip",
      price: 89.99,
      stock: 35,
      images: [],
      sellerId: testUser.id,
      categoryId: bagsCategory.id,
    },
    {
      name: "Travel Backpack",
      slug: "travel-backpack",
      description: "40L travel backpack with USB charging port, water-resistant",
      price: 69.99,
      stock: 45,
      images: [],
      sellerId: testUser.id,
      categoryId: bagsCategory.id,
    },
    // Drinkware
    {
      name: "Premium Coffee Mug",
      slug: "premium-coffee-mug",
      description: "High-quality ceramic coffee mug with premium finish",
      price: 29.99,
      stock: 50,
      images: [],
      sellerId: testUser.id,
      categoryId: drinkwareCategory.id,
    },
    {
      name: "Stainless Steel Water Bottle",
      slug: "stainless-steel-water-bottle",
      description: "Insulated 32oz bottle, keeps cold 24hr / hot 12hr",
      price: 34.99,
      stock: 90,
      images: [],
      sellerId: testUser.id,
      categoryId: drinkwareCategory.id,
    },
    {
      name: "Double-Wall Tumbler",
      slug: "double-wall-tumbler",
      description: "20oz vacuum insulated tumbler, BPA-free, leak-proof lid",
      price: 24.99,
      stock: 65,
      images: [],
      sellerId: testUser.id,
      categoryId: drinkwareCategory.id,
    },
    // Accessories (continued)
    {
      name: "Classic Aviator Sunglasses",
      slug: "classic-aviator-sunglasses",
      description: "UV400 protection, metal frame, polarized lenses",
      price: 44.99,
      stock: 70,
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

