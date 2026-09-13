import "server-only";
import { db } from "@/lib/db";
import type { OrderStatus } from "@/generated/prisma/enums";

const orderInclude = {
  items: {
    include: {
      menuItem: true,
      modifiers: { include: { modifier: true } },
    },
  },
  payments: true,
  table: true,
  user: true,
} as const;

export type OrderStatusFilter = OrderStatus | "ALL" | "ACTIVE";

// "ACTIVE" covers every not-yet-finalized state a placed order can be in —
// used by the "Open" tab so it doesn't miss orders that moved on to
// IN_KITCHEN/READY/SERVED while still awaiting payment.
const ACTIVE_STATUSES: OrderStatus[] = ["OPEN", "IN_KITCHEN", "READY", "SERVED"];

export async function getOrders(restaurantId: string, filter?: { status?: OrderStatusFilter }) {
  const status = filter?.status;
  const where =
    status === "ACTIVE"
      ? { status: { in: ACTIVE_STATUSES } }
      : status && status !== "ALL"
        ? { status }
        : {};
  return db.order.findMany({
    where: { restaurantId, ...where },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: orderInclude,
  });
}

export async function getOrderById(orderId: string, restaurantId: string) {
  return db.order.findFirst({
    where: { id: orderId, restaurantId },
    include: orderInclude,
  });
}

export async function getActiveKitchenOrders(restaurantId: string) {
  return db.order.findMany({
    where: {
      restaurantId,
      status: { in: ["OPEN", "IN_KITCHEN", "READY"] },
    },
    orderBy: { createdAt: "asc" },
    include: orderInclude,
  });
}

export type OrdersData = Awaited<ReturnType<typeof getOrders>>;
export type OrderDetail = Awaited<ReturnType<typeof getOrderById>>;
export type KitchenOrdersData = Awaited<ReturnType<typeof getActiveKitchenOrders>>;

export async function getNextOrderNumber(restaurantId: string): Promise<number> {
  const last = await db.order.findFirst({
    where: { restaurantId },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });
  return (last?.orderNumber ?? 0) + 1;
}
