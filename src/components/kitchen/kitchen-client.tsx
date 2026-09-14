"use client";

import * as React from "react";
import { Clock, ChefHat } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/cn";
import { minutesSince } from "@/lib/format";
import { updateKitchenItemStatusAction } from "@/lib/actions/order-actions";
import type { KitchenOrdersData } from "@/lib/data/orders";
import type { Serialized } from "@/types/serialized";
import type { KitchenStatus } from "@/generated/prisma/enums";

type Orders = Serialized<KitchenOrdersData>;

const STATUS_FLOW: KitchenStatus[] = ["QUEUED", "COOKING", "READY", "SERVED"];

function urgencyClasses(minutes: number) {
  if (minutes >= 20) return "border-danger";
  if (minutes >= 10) return "border-warning";
  return "border-border";
}

export function KitchenClient({ initialOrders }: { initialOrders: Orders }) {
  const { dict, locale } = useI18n();
  const [orders, setOrders] = React.useState<Orders>(initialOrders);
  const [, forceTick] = React.useState(0);

  React.useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/kitchen/active", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders);
        }
      } catch {
        // ignore transient network errors, next poll will retry
      }
    };
    const pollInterval = setInterval(poll, 10000);
    const tickInterval = setInterval(() => forceTick((t) => t + 1), 30000);
    return () => {
      clearInterval(pollInterval);
      clearInterval(tickInterval);
    };
  }, []);

  async function advance(orderItemId: string, current: KitchenStatus) {
    const idx = STATUS_FLOW.indexOf(current);
    const next = STATUS_FLOW[Math.min(idx + 1, STATUS_FLOW.length - 1)];
    setOrders((prev) =>
      prev.map((o) => ({
        ...o,
        items: o.items.map((i) => (i.id === orderItemId ? { ...i, kitchenStatus: next } : i)),
      }))
    );
    await updateKitchenItemStatusAction(orderItemId, next);
  }

  const statusLabel: Record<KitchenStatus, string> = {
    QUEUED: dict.kitchen.queued,
    COOKING: dict.kitchen.cooking,
    READY: dict.kitchen.ready,
    SERVED: dict.kitchen.served,
  };

  const actionLabel: Record<KitchenStatus, string> = {
    QUEUED: dict.kitchen.markCooking,
    COOKING: dict.kitchen.markReady,
    READY: dict.kitchen.markServed,
    SERVED: dict.kitchen.served,
  };

  const visibleOrders = orders.filter((o) => o.items.some((i) => i.kitchenStatus !== "SERVED"));

  return (
    <div className="p-4 sm:p-6">
      <p className="mb-4 text-xs text-text-muted">{dict.kitchen.autoRefresh}</p>
      {visibleOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-text-muted">
          <ChefHat className="mb-3 h-10 w-10" />
          <p className="text-sm font-medium">{dict.kitchen.noActiveOrders}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleOrders.map((order) => {
            const minutes = minutesSince(new Date(order.createdAt));
            return (
              <div key={order.id} className={cn("flex flex-col rounded-2xl border-2 bg-surface card-shadow", urgencyClasses(minutes))}>
                <div className="flex items-center justify-between border-b border-border p-3">
                  <div>
                    <p className="text-sm font-extrabold">
                      {dict.kitchen.orderNumber} #{order.orderNumber}
                    </p>
                    {order.table && (
                      <p className="text-xs text-text-muted">
                        {dict.kitchen.table} {order.table.label}
                      </p>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold text-text-muted">
                    <Clock className="h-3.5 w-3.5" />
                    {minutes} {dict.common.minutesShort}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  {order.items
                    .filter((i) => i.kitchenStatus !== "SERVED")
                    .map((item) => (
                      <div key={item.id} className="rounded-xl bg-surface-2 p-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold">
                            {item.quantity}× {locale === "ar" ? item.menuItem.nameAr : item.menuItem.nameEn}
                          </p>
                        </div>
                        {item.modifiers.length > 0 && (
                          <p className="mt-0.5 text-xs text-text-muted">
                            {item.modifiers.map((m) => (locale === "ar" ? m.modifier.nameAr : m.modifier.nameEn)).join("، ")}
                          </p>
                        )}
                        {item.notes && <p className="mt-0.5 text-xs italic text-text-muted">{item.notes}</p>}
                        <button
                          onClick={() => advance(item.id, item.kitchenStatus)}
                          disabled={item.kitchenStatus === "SERVED"}
                          className={cn(
                            "mt-2 w-full rounded-lg py-1.5 text-xs font-bold cursor-pointer",
                            item.kitchenStatus === "QUEUED" && "bg-warning/15 text-warning",
                            item.kitchenStatus === "COOKING" && "bg-accent/15 text-accent",
                            item.kitchenStatus === "READY" && "bg-success/15 text-success"
                          )}
                        >
                          {statusLabel[item.kitchenStatus]} → {actionLabel[item.kitchenStatus]}
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
