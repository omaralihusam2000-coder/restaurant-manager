import { requireRole, MANAGEMENT_ROLES } from "@/lib/auth";
import { getMenuForRestaurant, getModifierGroupsForRestaurant } from "@/lib/data/menu";
import { getRestaurant } from "@/lib/data/restaurant";
import { MenuClient } from "@/components/menu/menu-client";

export default async function MenuPage() {
  const session = await requireRole(MANAGEMENT_ROLES);
  const [categories, modifierGroups, restaurant] = await Promise.all([
    getMenuForRestaurant(session.restaurantId),
    getModifierGroupsForRestaurant(session.restaurantId),
    getRestaurant(session.restaurantId),
  ]);

  return <MenuClient categories={categories} modifierGroups={modifierGroups} restaurant={restaurant} />;
}
