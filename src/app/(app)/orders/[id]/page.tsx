import Link from "next/link";
import { notFound } from "next/navigation";
import { Printer, XCircle, ArrowRightCircle } from "lucide-react";
import { requireRole, POS_ROLES } from "@/lib/auth";
import { getOrderById } from "@/lib/data/orders";
import { getRestaurant } from "@/lib/data/restaurant";
import { getLocale } from "@/lib/preferences";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { formatMoney, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { cancelOrderFormAction } from "@/lib/actions/order-actions";
import { paymentMethodLabel } from "@/lib/payment-label";
import type { OrderStatus } from "@/generated/prisma/enums";

export default async function OrderDetailPage({ params }: PageProps<"/orders/[id]">) {
  const session = await requireRole(POS_ROLES);
  const { id } = await params;
  const [order, restaurant, locale] = await Promise.all([
    getOrderById(id, session.restaurantId),
    getRestaurant(session.restaurantId),
    getLocale(),
  ]);
  if (!order) notFound();

  const dict = getDictionary(locale);
  const money = (amount: number) => formatMoney(amount, restaurant.currency, locale);
  const orderTypeLabel = { DINE_IN: dict.pos.dineIn, TAKEAWAY: dict.pos.takeaway, DELIVERY: dict.pos.delivery };
  const statusLabel: Record<OrderStatus, string> = {
    OPEN: dict.orders.filterOpen,
    IN_KITCHEN: dict.kitchen.cooking,
    READY: dict.kitchen.ready,
    SERVED: dict.kitchen.served,
    PAID: dict.orders.filterPaid,
    CANCELLED: dict.orders.filterCancelled,
  };
  const isActive =
    order.status === "OPEN" ||
    order.status === "IN_KITCHEN" ||
    order.status === "READY" ||
    order.status === "SERVED";
  const payment = order.payments[0];

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>
              {dict.orders.orderDetails} #{order.orderNumber}
            </CardTitle>
            <p className="mt-1 text-xs text-text-muted">{formatDateTime(order.createdAt, locale)}</p>
          </div>
          <Badge tone={order.status === "CANCELLED" ? "danger" : order.status === "PAID" ? "success" : "warning"}>
            {statusLabel[order.status]}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-text-muted">{dict.orders.type}</p>
              <p className="font-semibold">{orderTypeLabel[order.type]}</p>
            </div>
            {order.table && (
              <div>
                <p className="text-text-muted">{dict.orders.table}</p>
                <p className="font-semibold">{order.table.label}</p>
              </div>
            )}
            {order.customerName && (
              <div>
                <p className="text-text-muted">{dict.pos.customerName}</p>
                <p className="font-semibold">{order.customerName}</p>
              </div>
            )}
            {order.user && (
              <div>
                <p className="text-text-muted">{dict.orders.cashier}</p>
                <p className="font-semibold">{order.user.name}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-2 rounded-xl bg-surface-2 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {item.quantity}× {locale === "ar" ? item.menuItem.nameAr : item.menuItem.nameEn}
                  </p>
                  {item.modifiers.length > 0 && (
                    <p className="text-xs text-text-muted">
                      {item.modifiers.map((m) => (locale === "ar" ? m.modifier.nameAr : m.modifier.nameEn)).join("، ")}
                    </p>
                  )}
                  {item.notes && <p className="text-xs italic text-text-muted">{item.notes}</p>}
                </div>
                <p className="shrink-0 text-sm font-bold">{money(item.unitPrice * item.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between text-text-muted">
              <span>{dict.common.subtotal}</span>
              <span>{money(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-text-muted">
                <span>{dict.common.discount}</span>
                <span>-{money(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-text-muted">
              <span>{dict.common.tax}</span>
              <span>{money(order.taxAmount)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold">
              <span>{dict.common.total}</span>
              <span className="text-primary">{money(order.total)}</span>
            </div>
          </div>

          {payment && (
            <div className="rounded-xl bg-surface-2 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">{dict.pos.payment}</span>
                <span className="font-semibold">{paymentMethodLabel(payment.method, dict)}</span>
              </div>
              {payment.changeAmount ? (
                <div className="mt-1 flex justify-between">
                  <span className="text-text-muted">{dict.pos.change}</span>
                  <span className="font-semibold">{money(payment.changeAmount)}</span>
                </div>
              ) : null}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Link href={`/receipt/${order.id}`}>
              <Button variant="secondary">
                <Printer className="h-4 w-4" />
                {dict.pos.printReceipt}
              </Button>
            </Link>
            {isActive && (
              <>
                <Link href={`/pos?orderId=${order.id}`}>
                  <Button>
                    <ArrowRightCircle className="h-4 w-4" />
                    {dict.pos.checkout}
                  </Button>
                </Link>
                <form action={cancelOrderFormAction.bind(null, order.id)}>
                  <ConfirmSubmitButton variant="danger" confirmMessage={dict.menu.deleteConfirm}>
                    <XCircle className="h-4 w-4" />
                    {dict.common.cancel}
                  </ConfirmSubmitButton>
                </form>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
