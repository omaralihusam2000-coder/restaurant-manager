import "server-only";
import { db } from "@/lib/db";

export async function getRestaurant(restaurantId: string) {
  return db.restaurant.findUniqueOrThrow({ where: { id: restaurantId } });
}

export type RestaurantRecord = Awaited<ReturnType<typeof getRestaurant>>;
