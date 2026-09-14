import "server-only";
import { db } from "@/lib/db";

export async function getMenuForRestaurant(restaurantId: string) {
  const categories = await db.category.findMany({
    where: { restaurantId },
    orderBy: { sortOrder: "asc" },
    include: {
      menuItems: {
        orderBy: { sortOrder: "asc" },
        include: {
          modifierGroups: {
            include: {
              modifierGroup: {
                include: { modifiers: true },
              },
            },
          },
        },
      },
    },
  });
  return categories;
}

export type MenuData = Awaited<ReturnType<typeof getMenuForRestaurant>>;

export async function getModifierGroupsForRestaurant(restaurantId: string) {
  return db.modifierGroup.findMany({
    where: { restaurantId },
    include: { modifiers: true },
    orderBy: { nameAr: "asc" },
  });
}

export type ModifierGroupsData = Awaited<ReturnType<typeof getModifierGroupsForRestaurant>>;
