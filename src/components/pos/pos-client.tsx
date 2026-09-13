"use client";

import * as React from "react";
import { Search, ShoppingCart } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { useCartStore } from "@/stores/cart-store";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { lineTotal } from "@/types/cart";
import type { MenuData } from "@/lib/data/menu";
import type { TablesData, OpenOrderData } from "@/lib/data/tables";
import type { RestaurantRecord } from "@/lib/data/restaurant";
import { CartPanel } from "./cart-panel";
import { ModifierDialog, type ModifierDialogItem } from "./modifier-dialog";
import { useToast } from "@/components/ui/toast";

export function PosClient({
  categories,
  tables,
  restaurant,
  preselectTableId,
  preselectKey,
  existingOrder,
}: {
  categories: MenuData;
  tables: TablesData;
  restaurant: RestaurantRecord;
  preselectTableId: string | null;
  preselectKey: string | null;
  existingOrder: OpenOrderData;
}) {
  const { dict, locale } = useI18n();
  const { toast } = useToast();
  const cart = useCartStore();
  const [search, setSearch] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<string>("all");
  const [modifierItem, setModifierItem] = React.useState<ModifierDialogItem | null>(null);
  const [mobileCartOpen, setMobileCartOpen] = React.useState(false);
  const syncedOrderKey = React.useRef<string | null>(null);

  React.useEffect(() => {
    const key = `${preselectKey ?? "none"}:${existingOrder?.id ?? "none"}`;
    if (syncedOrderKey.current === key) return;
    syncedOrderKey.current = key;

    if (!preselectKey) return;

    if (existingOrder) {
      cart.loadExistingOrder({
        orderId: existingOrder.id,
        tableId: existingOrder.tableId,
        tableLabel: tables.find((t) => t.id === existingOrder.tableId)?.label ?? null,
        orderType: existingOrder.type,
        customerName: existingOrder.customerName ?? "",
        customerPhone: existingOrder.customerPhone ?? "",
        orderNotes: existingOrder.notes ?? "",
        discount: existingOrder.discount,
        lines: existingOrder.items.map((item) => ({
          lineId: item.id,
          menuItemId: item.menuItemId,
          nameAr: item.menuItem.nameAr,
          nameEn: item.menuItem.nameEn,
          emoji: item.menuItem.emoji,
          basePrice: item.menuItem.price,
          quantity: item.quantity,
          notes: item.notes ?? undefined,
          modifiers: item.modifiers.map((m) => ({
            modifierId: m.modifierId,
            nameAr: m.modifier.nameAr,
            nameEn: m.modifier.nameEn,
            priceDelta: m.priceDelta,
          })),
        })),
      });
    } else if (cart.tableId !== preselectTableId) {
      cart.clear();
      cart.setOrderType("DINE_IN");
      const table = tables.find((t) => t.id === preselectTableId);
      cart.setTable(preselectTableId, table?.label ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectKey, existingOrder]);

  const allItems = React.useMemo(
    () => categories.flatMap((c) => c.menuItems.map((item) => ({ item, category: c }))),
    [categories]
  );

  const visibleItems = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return allItems.filter(({ item, category }) => {
      if (q) {
        return item.nameAr.toLowerCase().includes(q) || item.nameEn.toLowerCase().includes(q);
      }
      return activeCategory === "all" || category.id === activeCategory;
    });
  }, [allItems, search, activeCategory]);

  function findMatchingLine(menuItemId: string, modifierIds: string[]) {
    const sorted = [...modifierIds].sort();
    return cart.lines.find(
      (l) =>
        l.menuItemId === menuItemId &&
        !l.notes &&
        l.modifiers.length === sorted.length &&
        [...l.modifiers.map((m) => m.modifierId)].sort().every((id, i) => id === sorted[i])
    );
  }

  function handleAddItem(item: MenuData[number]["menuItems"][number]) {
    if (item.modifierGroups.length > 0) {
      setModifierItem({
        id: item.id,
        nameAr: item.nameAr,
        nameEn: item.nameEn,
        emoji: item.emoji,
        price: item.price,
        modifierGroups: item.modifierGroups.map((mg) => mg.modifierGroup),
      });
      return;
    }
    const existing = findMatchingLine(item.id, []);
    if (existing) {
      cart.updateQuantity(existing.lineId, existing.quantity + 1);
    } else {
      cart.addLine({
        menuItemId: item.id,
        nameAr: item.nameAr,
        nameEn: item.nameEn,
        emoji: item.emoji,
        basePrice: item.price,
        quantity: 1,
        modifiers: [],
      });
    }
    toast(dict.pos.itemAdded, "success");
  }

  function handleConfirmModifiers(payload: {
    quantity: number;
    notes?: string;
    modifiers: { modifierId: string; nameAr: string; nameEn: string; priceDelta: number }[];
  }) {
    if (!modifierItem) return;
    const modifierIds = payload.modifiers.map((m) => m.modifierId);
    const existing = !payload.notes ? findMatchingLine(modifierItem.id, modifierIds) : undefined;
    if (existing) {
      cart.updateQuantity(existing.lineId, existing.quantity + payload.quantity);
    } else {
      cart.addLine({
        menuItemId: modifierItem.id,
        nameAr: modifierItem.nameAr,
        nameEn: modifierItem.nameEn,
        emoji: modifierItem.emoji,
        basePrice: modifierItem.price,
        quantity: payload.quantity,
        notes: payload.notes,
        modifiers: payload.modifiers,
      });
    }
    setModifierItem(null);
    toast(dict.pos.itemAdded, "success");
  }

  const cartTotal = cart.lines.reduce((sum, l) => sum + lineTotal(l), 0);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border bg-surface p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={dict.pos.searchPlaceholder}
              className="h-11 w-full rounded-xl border border-border bg-surface-2 ps-9 pe-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
            <button
              onClick={() => setActiveCategory("all")}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                activeCategory === "all" ? "bg-primary text-primary-foreground" : "bg-surface-2 text-text-muted hover:text-text"
              )}
            >
              {dict.pos.all}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  activeCategory === c.id ? "bg-primary text-primary-foreground" : "bg-surface-2 text-text-muted hover:text-text"
                )}
              >
                <span>{c.emoji}</span>
                {locale === "ar" ? c.nameAr : c.nameEn}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 pb-24 lg:pb-3">
            {visibleItems.map(({ item }) => (
              <button
                key={item.id}
                disabled={!item.available}
                onClick={() => handleAddItem(item)}
                className={cn(
                  "group flex flex-col items-start gap-2 rounded-2xl border border-border bg-surface p-3 text-start card-shadow transition-transform active:scale-[0.97]",
                  item.available ? "hover:border-primary/50 cursor-pointer" : "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2 text-2xl">
                  {item.emoji}
                </div>
                <div className="min-w-0 w-full">
                  <p className="truncate text-sm font-bold">{locale === "ar" ? item.nameAr : item.nameEn}</p>
                  <p className="mt-0.5 text-sm font-semibold text-primary">
                    {formatMoney(item.price, restaurant.currency, locale)}
                  </p>
                </div>
                {!item.available && (
                  <span className="text-xs font-semibold text-danger">{dict.common.unavailable}</span>
                )}
              </button>
            ))}
            {visibleItems.length === 0 && (
              <p className="col-span-full py-10 text-center text-sm text-text-muted">—</p>
            )}
          </div>
        </div>
      </div>

      {/* Desktop cart */}
      <div className="hidden lg:block lg:w-[380px] lg:shrink-0 lg:border-s lg:border-border">
        <CartPanel restaurant={restaurant} tables={tables} onOrderSaved={() => {}} />
      </div>

      {/* Mobile floating cart bar */}
      {cart.lines.length > 0 && (
        <button
          onClick={() => setMobileCartOpen(true)}
          className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-between rounded-2xl bg-primary px-4 py-3.5 text-primary-foreground shadow-2xl lg:hidden cursor-pointer"
        >
          <span className="flex items-center gap-2 text-sm font-bold">
            <ShoppingCart className="h-5 w-5" />
            {cart.lines.reduce((s, l) => s + l.quantity, 0)} · {dict.pos.cart}
          </span>
          <span className="text-sm font-extrabold">{formatMoney(cartTotal, restaurant.currency, locale)}</span>
        </button>
      )}

      {mobileCartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background lg:hidden">
          <CartPanel
            restaurant={restaurant}
            tables={tables}
            onClose={() => setMobileCartOpen(false)}
            onOrderSaved={() => setMobileCartOpen(false)}
          />
        </div>
      )}

      {modifierItem && (
        <ModifierDialog
          item={modifierItem}
          restaurant={restaurant}
          onClose={() => setModifierItem(null)}
          onConfirm={handleConfirmModifiers}
        />
      )}
    </div>
  );
}

