import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getOrderById } from "@/lib/data/orders";
import { getRestaurant } from "@/lib/data/restaurant";
import { getLocale } from "@/lib/preferences";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { formatMoney, formatDateTime } from "@/lib/format";
import { paymentMethodLabel } from "@/lib/payment-label";
import { ReceiptActions } from "./receipt-actions";

export default async function ReceiptPage({ params }: PageProps<"/receipt/[id]">) {
  const session = await requireSession();
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
  const payment = order.payments[0];

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center bg-background px-4 py-8">
      <div className="no-print mb-4 w-full">
        <ReceiptActions dict={dict} />
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 card-shadow print:border-0 print:shadow-none">
        <div className="text-center">
          <p className="text-3xl">{restaurant.logoEmoji}</p>
          <h1 className="mt-1 text-lg font-extrabold">{restaurant.name}</h1>
          {restaurant.address && <p className="text-xs text-text-muted">{restaurant.address}</p>}
          {restaurant.phone && <p className="text-xs text-text-muted">{restaurant.phone}</p>}
        </div>

        <div className="my-4 border-t border-dashed border-border" />

        <div className="flex justify-between text-xs text-text-muted">
          <span>
            {dict.orders.orderNumber} #{order.orderNumber}
          </span>
          <span>{formatDateTime(order.createdAt, locale)}</span>
        </div>
        <div className="mt-1 flex justify-between text-xs text-text-muted">
          <span>{orderTypeLabel[order.type]}</span>
          {order.table && <span>{order.table.label}</span>}
        </div>

        <div className="my-4 border-t border-dashed border-border" />

        <div className="flex flex-col gap-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-2 text-sm">
              <span className="min-w-0">
                {item.quantity}× {locale === "ar" ? item.menuItem.nameAr : item.menuItem.nameEn}
                {item.modifiers.length > 0 && (
                  <span className="block text-xs text-text-muted">
                    {item.modifiers.map((m) => (locale === "ar" ? m.modifier.nameAr : m.modifier.nameEn)).join("، ")}
                  </span>
                )}
              </span>
              <span className="shrink-0 font-medium">{money(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="my-4 border-t border-dashed border-border" />

        <div className="space-y-1 text-sm">
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
            <span>
              {dict.common.tax} ({restaurant.taxRate}%)
            </span>
            <span>{money(order.taxAmount)}</span>
          </div>
          <div className="flex justify-between text-base font-extrabold">
            <span>{dict.common.total}</span>
            <span>{money(order.total)}</span>
          </div>
        </div>

        {payment && (
          <>
            <div className="my-4 border-t border-dashed border-border" />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-text-muted">
                <span>{dict.pos.payment}</span>
                <span>{paymentMethodLabel(payment.method, dict)}</span>
              </div>
              {payment.tenderedAmount != null && (
                <div className="flex justify-between text-text-muted">
                  <span>{dict.pos.amountTendered}</span>
                  <span>{money(payment.tenderedAmount)}</span>
                </div>
              )}
              {!!payment.changeAmount && (
                <div className="flex justify-between text-text-muted">
                  <span>{dict.pos.change}</span>
                  <span>{money(payment.changeAmount)}</span>
                </div>
              )}
            </div>
          </>
        )}

        <div className="my-4 border-t border-dashed border-border" />
        <p className="text-center text-xs text-text-muted">
          {locale === "ar" ? "شكرًا لزيارتكم 🌟" : "Thank you for visiting 🌟"}
        </p>
      </div>
    </div>
  );
}
