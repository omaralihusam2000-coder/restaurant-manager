import { NextResponse } from "next/server";
import { getSession, KITCHEN_ROLES } from "@/lib/auth";
import { getActiveKitchenOrders } from "@/lib/data/orders";

export async function GET() {
  const session = await getSession();
  if (!session || !KITCHEN_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const orders = await getActiveKitchenOrders(session.restaurantId);
  return NextResponse.json({ orders });
}
