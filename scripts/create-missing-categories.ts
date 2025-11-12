import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log("📄 Loaded .env file\n");
}

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Creating missing categories...\n");

  const categoriesToCreate = [
    { name: "Technology", slug: "technology" },
    { name: "Drinkware", slug: "drinkware" },
    { name: "Bag", slug: "bag" },
    { name: "Office", slug: "office" },
  ];

  for (const categoryData of categoriesToCreate) {
    const existing = await prisma.category.findUnique({
      where: { slug: categoryData.slug },
    });

    if (existing) {
      console.log(`✅ Category "${categoryData.name}" already exists (slug: ${categoryData.slug})`);
    } else {
      const category = await prisma.category.create({
        data: {
          name: categoryData.name,
          slug: categoryData.slug,
        },
      });
      console.log(`✅ Created category: ${category.name} (slug: ${category.slug})`);
    }
  }

  console.log("\n📋 All categories:");
  const allCategories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  allCategories.forEach((cat) => {
    console.log(`   - ${cat.name} (slug: ${cat.slug}) - ${cat._count.products} products`);
  });
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });








