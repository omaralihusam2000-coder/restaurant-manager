import { requireRole, KITCHEN_ROLES } from "@/lib/auth";
import { getActiveKitchenOrders } from "@/lib/data/orders";
import { KitchenClient } from "@/components/kitchen/kitchen-client";

export default async function KitchenPage() {
  const session = await requireRole(KITCHEN_ROLES);
  const orders = await getActiveKitchenOrders(session.restaurantId);
  return <KitchenClient initialOrders={JSON.parse(JSON.stringify(orders))} />;
}
