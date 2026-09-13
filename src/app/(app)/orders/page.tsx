import Link from "next/link";
import { requireRole, POS_ROLES } from "@/lib/auth";
import { getOrders, type OrderStatusFilter } from "@/lib/data/orders";
import { getRestaurant } from "@/lib/data/restaurant";
import { getLocale } from "@/lib/preferences";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { formatMoney, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { OrderStatus } from "@/generated/prisma/enums";

const STATUS_TONE: Record<OrderStatus, "neutral" | "primary" | "success" | "warning" | "danger" | "accent"> = {
  OPEN: "neutral",
  IN_KITCHEN: "warning",
  READY: "accent",
  SERVED: "primary",
  PAID: "success",
  CANCELLED: "danger",
};

export default async function OrdersPage({ searchParams }: PageProps<"/orders">) {
  const session = await requireRole(POS_ROLES);
  const params = await searchParams;
  const status = typeof params.status === "string" ? (params.status as OrderStatusFilter) : "ALL";

  const [orders, restaurant, locale] = await Promise.all([
    getOrders(session.restaurantId, { status }),
    getRestaurant(session.restaurantId),
    getLocale(),
  ]);
  const dict = getDictionary(locale);

  const statusLabel: Record<OrderStatus, string> = {
    OPEN: dict.orders.filterOpen,
    IN_KITCHEN: dict.kitchen.cooking,
    READY: dict.kitchen.ready,
    SERVED: dict.kitchen.served,
    PAID: dict.orders.filterPaid,
    CANCELLED: dict.orders.filterCancelled,
  };

  const tabs: { key: OrderStatusFilter; label: string }[] = [
    { key: "ALL", label: dict.orders.filterAll },
    { key: "ACTIVE", label: dict.orders.filterOpen },
    { key: "PAID", label: dict.orders.filterPaid },
    { key: "CANCELLED", label: dict.orders.filterCancelled },
  ];

  const orderTypeLabel = { DINE_IN: dict.pos.dineIn, TAKEAWAY: dict.pos.takeaway, DELIVERY: dict.pos.delivery };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-thin">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "ALL" ? "/orders" : `/orders?status=${tab.key}`}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              status === tab.key ? "bg-primary text-primary-foreground" : "bg-surface-2 text-text-muted hover:text-text"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="py-16 text-center text-sm text-text-muted">{dict.orders.noOrders}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3.5 card-shadow hover:border-primary/40"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold">#{order.orderNumber}</span>
                  <Badge tone={STATUS_TONE[order.status]}>{statusLabel[order.status]}</Badge>
                </div>
                <p className="mt-1 truncate text-xs text-text-muted">
                  {orderTypeLabel[order.type]}
                  {order.table ? ` · ${order.table.label}` : ""} · {formatDateTime(order.createdAt, locale)}
                </p>
              </div>
              <p className="shrink-0 text-sm font-extrabold text-primary">
                {formatMoney(order.total, restaurant.currency, locale)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
