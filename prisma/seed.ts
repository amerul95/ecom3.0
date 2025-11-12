import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      password: adminPassword,
      role: Role.ADMIN,
      emailVerified: new Date(),
    },
  });
  console.log("✅ Created admin user:", admin.email);

  // Create buyer user
  const buyerPassword = await bcrypt.hash("buyer123", 10);
  const buyer = await prisma.user.upsert({
    where: { email: "buyer@example.com" },
    update: {},
    create: {
      email: "buyer@example.com",
      name: "Buyer User",
      password: buyerPassword,
      role: Role.BUYER,
      emailVerified: new Date(),
    },
  });
  console.log("✅ Created buyer user:", buyer.email);

  // Create seller user with seller profile
  const sellerPassword = await bcrypt.hash("seller123", 10);
  const sellerUser = await prisma.user.upsert({
    where: { email: "seller@example.com" },
    update: {
      role: Role.SELLER, // Ensure role is SELLER
    },
    create: {
      email: "seller@example.com",
      name: "Seller User",
      password: sellerPassword,
      role: Role.SELLER,
      emailVerified: new Date(),
      sellerProfile: {
        create: {
          storeName: "Premium Store",
          verified: true,
        },
      },
    },
    include: {
      sellerProfile: true,
    },
  });
  console.log("✅ Created seller user:", sellerUser.email);

  // Get or create seller profile
  let sellerProfile = sellerUser.sellerProfile;
  
  if (!sellerProfile) {
    // Profile doesn't exist, create it
    sellerProfile = await prisma.sellerProfile.create({
      data: {
        userId: sellerUser.id,
        storeName: "Premium Store",
        verified: true,
      },
    });
    console.log("✅ Created seller profile for existing user");
  }

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
      sellerId: sellerProfile.id,
      categoryId: accessoriesCategory.id,
    },
    {
      name: "Cotton T-Shirt",
      slug: "cotton-t-shirt",
      description: "Comfortable 100% cotton t-shirt in various colors",
      price: 24.99,
      stock: 100,
      images: [],
      sellerId: sellerProfile.id,
      categoryId: apparelCategory.id,
    },
    {
      name: "Wireless Headphones",
      slug: "wireless-headphones",
      description: "Premium wireless headphones with noise cancellation",
      price: 149.99,
      stock: 30,
      images: [],
      sellerId: sellerProfile.id,
      categoryId: electronicsCategory.id,
    },
    {
      name: "Leather Wallet",
      slug: "leather-wallet",
      description: "Genuine leather wallet with multiple card slots",
      price: 49.99,
      stock: 75,
      images: [],
      sellerId: sellerProfile.id,
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

