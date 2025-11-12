import { prisma } from "./prisma";

export const DEFAULT_CATEGORIES = [
  { name: "Apparel", slug: "apparel" },
  { name: "Technology", slug: "technology" },
  { name: "Drinkware", slug: "drinkware" },
  { name: "Bags", slug: "bags" },
  { name: "Office", slug: "office" },
];

export async function ensureDefaultCategories() {
  const existing = await prisma.category.findMany({
    where: {
      slug: {
        in: DEFAULT_CATEGORIES.map((category) => category.slug),
      },
    },
    select: {
      slug: true,
    },
  });

  const existingSlugs = new Set(existing.map((category) => category.slug));
  const categoriesToCreate = DEFAULT_CATEGORIES.filter(
    (category) => !existingSlugs.has(category.slug)
  );

  if (categoriesToCreate.length > 0) {
    await prisma.category.createMany({
      data: categoriesToCreate,
      skipDuplicates: true,
    });
  }
}
