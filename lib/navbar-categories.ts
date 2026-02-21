import { prisma } from "@/lib/prisma";
import { ensureDefaultCategories } from "@/lib/default-categories";

export type NavbarCategory = {
  id: string;
  name: string;
  slug: string;
};

/**
 * Fetches root categories for navbar. Cached at layout level - no refetch on client navigation.
 */
export async function getNavbarCategories(): Promise<NavbarCategory[]> {
  await ensureDefaultCategories();

  const categories = await prisma.category.findMany({
    where: { parentId: null },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  return categories;
}
