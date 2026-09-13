import "server-only";
import { db } from "@/lib/db";

export async function getTablesForRestaurant(restaurantId: string) {
  return db.table.findMany({
    where: { restaurantId },
    orderBy: [{ zone: "asc" }, { label: "asc" }],
  });
}

export async function getOpenOrderForTable(tableId: string) {
  return db.order.findFirst({
    where: {
      tableId,
      status: { in: ["OPEN", "IN_KITCHEN", "READY"] },
    },
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { menuItem: true, modifiers: { include: { modifier: true } } } },
    },
  });
}

export type TablesData = Awaited<ReturnType<typeof getTablesForRestaurant>>;
export type OpenOrderData = Awaited<ReturnType<typeof getOpenOrderForTable>>;
