import { requireRole, POS_ROLES } from "@/lib/auth";
import { getMenuForRestaurant } from "@/lib/data/menu";
import { getTablesForRestaurant, getOpenOrderForTable } from "@/lib/data/tables";
import { getOrderById } from "@/lib/data/orders";
import { getRestaurant } from "@/lib/data/restaurant";
import { PosClient } from "@/components/pos/pos-client";

export default async function PosPage({ searchParams }: PageProps<"/pos">) {
  const session = await requireRole(POS_ROLES);
  const params = await searchParams;
  const tableId = typeof params.tableId === "string" ? params.tableId : undefined;
  const orderId = typeof params.orderId === "string" ? params.orderId : undefined;

  const [categories, tables, restaurant] = await Promise.all([
    getMenuForRestaurant(session.restaurantId),
    getTablesForRestaurant(session.restaurantId),
    getRestaurant(session.restaurantId),
  ]);

  const existingOrder = orderId
    ? await getOrderById(orderId, session.restaurantId)
    : tableId
      ? await getOpenOrderForTable(tableId)
      : null;

  return (
    <PosClient
      categories={categories}
      tables={tables}
      restaurant={restaurant}
      preselectTableId={tableId ?? null}
      preselectKey={orderId ?? tableId ?? null}
      existingOrder={existingOrder}
    />
  );
}
