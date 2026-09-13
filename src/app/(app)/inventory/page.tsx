import { requireRole, MANAGEMENT_ROLES } from "@/lib/auth";
import { getInventoryForRestaurant } from "@/lib/data/inventory";
import { InventoryClient } from "@/components/inventory/inventory-client";

export default async function InventoryPage() {
  const session = await requireRole(MANAGEMENT_ROLES);
  const items = await getInventoryForRestaurant(session.restaurantId);
  return <InventoryClient items={items} />;
}
