import { requireRole, POS_ROLES } from "@/lib/auth";
import { getTablesForRestaurant } from "@/lib/data/tables";
import { TablesClient } from "@/components/tables/tables-client";

export default async function TablesPage() {
  const session = await requireRole(POS_ROLES);
  const tables = await getTablesForRestaurant(session.restaurantId);
  return <TablesClient tables={tables} />;
}
