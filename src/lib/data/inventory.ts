import "server-only";
import { db } from "@/lib/db";

export async function getInventoryForRestaurant(restaurantId: string) {
  return db.inventoryItem.findMany({
    where: { restaurantId },
    orderBy: { nameAr: "asc" },
  });
}
