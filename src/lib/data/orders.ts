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

const ORDERS_PAGE_SIZE = 25;

export async function getOrders(
  restaurantId: string,
  filter?: { status?: OrderStatusFilter; page?: number }
) {
  const status = filter?.status;
  const where =
    status === "ACTIVE"
      ? { status: { in: ACTIVE_STATUSES } }
      : status && status !== "ALL"
        ? { status }
        : {};
  const page = Math.max(1, filter?.page ?? 1);

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where: { restaurantId, ...where },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ORDERS_PAGE_SIZE,
      take: ORDERS_PAGE_SIZE,
      include: orderInclude,
    }),
    db.order.count({ where: { restaurantId, ...where } }),
  ]);

  return { orders, total, page, pageSize: ORDERS_PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE)) };
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

export type OrdersPage = Awaited<ReturnType<typeof getOrders>>;
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
