import "server-only";
import { db } from "@/lib/db";

export async function getUsersForRestaurant(restaurantId: string) {
  return db.user.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "asc" },
  });
}
