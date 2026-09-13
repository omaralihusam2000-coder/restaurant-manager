"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, X, ShoppingBag, Bike, UtensilsCrossed } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { useCartStore } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";
import { Select, Textarea, Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { lineTotal, type OrderType } from "@/types/cart";
import { computeOrderTotals } from "@/lib/order-calc";
import { submitOrderAction } from "@/lib/actions/order-actions";
import type { RestaurantRecord } from "@/lib/data/restaurant";
import type { TablesData } from "@/lib/data/tables";
import { PaymentDialog } from "./payment-dialog";

const ORDER_TYPE_ICONS: Record<OrderType, React.ComponentType<{ className?: string }>> = {
  DINE_IN: UtensilsCrossed,
  TAKEAWAY: ShoppingBag,
  DELIVERY: Bike,
};

export function CartPanel({
  restaurant,
  tables,
  onClose,
  onOrderSaved,
}: {
  restaurant: RestaurantRecord;
  tables: TablesData;
  onClose?: () => void;
  onOrderSaved: () => void;
}) {
  const { dict, locale } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const cart = useCartStore();
  const [pending, setPending] = React.useState(false);
  const [paymentOpen, setPaymentOpen] = React.useState(false);

  const subtotal = cart.lines.reduce((sum, l) => sum + lineTotal(l), 0);
  const totals = computeOrderTotals(subtotal, cart.discount, restaurant.taxRate);

  function buildPayload(mode: "kitchen" | "pay", payment?: { method: "CASH" | "CARD" | "WALLET"; tenderedAmount?: number }) {
    return {
      orderId: cart.orderId ?? undefined,
      type: cart.orderType,
      tableId: cart.orderType === "DINE_IN" ? cart.tableId ?? undefined : undefined,
      customerName: cart.customerName || undefined,
      customerPhone: cart.customerPhone || undefined,
      notes: cart.orderNotes || undefined,
      discount: cart.discount,
      lines: cart.lines.map((l) => ({
        menuItemId: l.menuItemId,
        quantity: l.quantity,
        notes: l.notes,
        modifierIds: l.modifiers.map((m) => m.modifierId),
      })),
      mode,
      payment,
    };
  }

  async function handleSendToKitchen() {
    if (cart.lines.length === 0) return;
    if (cart.orderType === "DINE_IN" && !cart.tableId) {
      toast(dict.pos.selectTable, "error");
      return;
    }
    setPending(true);
    const orderType = cart.orderType;
    const result = await submitOrderAction(buildPayload("kitchen"));
    setPending(false);
    if (result.ok) {
      toast(dict.pos.orderPlaced, "success");
      cart.clear();
      onOrderSaved();
      if (orderType === "DINE_IN") router.push("/tables");
    } else {
      toast(dict.common.error, "error");
    }
  }

  async function handlePay(payment: { method: "CASH" | "CARD" | "WALLET"; tenderedAmount?: number }) {
    setPending(true);
    const result = await submitOrderAction(buildPayload("pay", payment));
    setPending(false);
    if (result.ok) {
      toast(dict.pos.orderPlaced, "success");
      cart.clear();
      onOrderSaved();
      setPaymentOpen(false);
      router.push(`/receipt/${result.orderId}`);
    } else {
      toast(dict.common.error, "error");
    }
  }

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="text-base font-bold">{dict.pos.cart}</h2>
        {onClose && (
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-surface-2 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="flex gap-2 p-4 pb-2">
          {(["DINE_IN", "TAKEAWAY", "DELIVERY"] as OrderType[]).map((type) => {
            const Icon = ORDER_TYPE_ICONS[type];
            const label = type === "DINE_IN" ? dict.pos.dineIn : type === "TAKEAWAY" ? dict.pos.takeaway : dict.pos.delivery;
            return (
              <button
                key={type}
                onClick={() => cart.setOrderType(type)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-xl border py-2 text-xs font-semibold transition-colors cursor-pointer",
                  cart.orderType === type
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-text-muted hover:bg-surface-2"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>

        {cart.orderType === "DINE_IN" ? (
          <div className="px-4 pb-2">
            <Select value={cart.tableId ?? ""} onChange={(e) => {
              const table = tables.find((t) => t.id === e.target.value);
              cart.setTable(e.target.value || null, table?.label ?? null);
            }}>
              <option value="">{dict.pos.noTable}</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.zone} · {t.label}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 px-4 pb-2">
            <Input
              placeholder={dict.pos.customerName}
              value={cart.customerName}
              onChange={(e) => cart.setCustomer(e.target.value, cart.customerPhone)}
            />
            <Input
              placeholder={dict.pos.customerPhone}
              value={cart.customerPhone}
              onChange={(e) => cart.setCustomer(cart.customerName, e.target.value)}
            />
          </div>
        )}

        <div className="flex flex-col gap-2 p-4 pt-2">
          {cart.lines.length === 0 && (
            <p className="py-10 text-center text-sm text-text-muted">{dict.pos.emptyCart}</p>
          )}
          {cart.lines.map((line) => (
            <div key={line.lineId} className="flex items-start gap-2 rounded-xl border border-border p-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-lg">
                {line.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{locale === "ar" ? line.nameAr : line.nameEn}</p>
                {line.modifiers.length > 0 && (
                  <p className="truncate text-xs text-text-muted">
                    {line.modifiers.map((m) => (locale === "ar" ? m.nameAr : m.nameEn)).join("، ")}
                  </p>
                )}
                {line.notes && <p className="truncate text-xs italic text-text-muted">{line.notes}</p>}
                <div className="mt-1.5 flex items-center gap-2">
                  <button
                    onClick={() => cart.updateQuantity(line.lineId, line.quantity - 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-2 cursor-pointer"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-4 text-center text-sm font-bold">{line.quantity}</span>
                  <button
                    onClick={() => cart.updateQuantity(line.lineId, line.quantity + 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-2 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <p className="text-sm font-bold">{formatMoney(lineTotal(line), restaurant.currency, locale)}</p>
                <button onClick={() => cart.removeLine(line.lineId)} className="text-danger cursor-pointer">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {cart.lines.length > 0 && (
          <div className="flex flex-col gap-3 px-4 pb-4">
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-xs font-semibold text-text-muted">{dict.pos.discountAmount}</span>
              <Input
                type="number"
                min={0}
                value={cart.discount || ""}
                onChange={(e) => cart.setDiscount(Number(e.target.value) || 0)}
                className="h-8"
              />
            </div>
            <Textarea
              rows={2}
              placeholder={dict.pos.addNote}
              value={cart.orderNotes}
              onChange={(e) => cart.setOrderNotes(e.target.value)}
            />
          </div>
        )}
      </div>

      {cart.lines.length > 0 && (
        <div className="border-t border-border p-4">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-text-muted">
              <span>{dict.common.subtotal}</span>
              <span>{formatMoney(totals.subtotal, restaurant.currency, locale)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-text-muted">
                <span>{dict.common.discount}</span>
                <span>-{formatMoney(totals.discount, restaurant.currency, locale)}</span>
              </div>
            )}
            <div className="flex justify-between text-text-muted">
              <span>
                {dict.common.tax} ({restaurant.taxRate}%)
              </span>
              <span>{formatMoney(totals.taxAmount, restaurant.currency, locale)}</span>
            </div>
            <div className="flex justify-between pt-1 text-base font-extrabold">
              <span>{dict.common.total}</span>
              <span className="text-primary">{formatMoney(totals.total, restaurant.currency, locale)}</span>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={handleSendToKitchen} disabled={pending}>
              {dict.pos.sendToKitchen}
            </Button>
            <Button className="flex-1" onClick={() => setPaymentOpen(true)} disabled={pending}>
              {dict.pos.checkout}
            </Button>
          </div>
          <button
            onClick={() => cart.clear()}
            className="mt-2 w-full text-center text-xs font-semibold text-text-muted hover:text-danger cursor-pointer"
          >
            {dict.pos.clearCart}
          </button>
        </div>
      )}

      {paymentOpen && (
        <PaymentDialog
          total={totals.total}
          restaurant={restaurant}
          pending={pending}
          onClose={() => setPaymentOpen(false)}
          onConfirm={handlePay}
        />
      )}
    </div>
  );
}
