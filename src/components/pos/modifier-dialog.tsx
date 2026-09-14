"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import type { RestaurantRecord } from "@/lib/data/restaurant";

export type ModifierDialogItem = {
  id: string;
  nameAr: string;
  nameEn: string;
  emoji: string;
  price: number;
  modifierGroups: {
    id: string;
    nameAr: string;
    nameEn: string;
    required: boolean;
    multiSelect: boolean;
    modifiers: { id: string; nameAr: string; nameEn: string; priceDelta: number }[];
  }[];
};

export function ModifierDialog({
  item,
  restaurant,
  onClose,
  onConfirm,
}: {
  item: ModifierDialogItem;
  restaurant: RestaurantRecord;
  onClose: () => void;
  onConfirm: (payload: {
    quantity: number;
    notes?: string;
    modifiers: { modifierId: string; nameAr: string; nameEn: string; priceDelta: number }[];
  }) => void;
}) {
  const { dict, locale } = useI18n();
  const [quantity, setQuantity] = React.useState(1);
  const [notes, setNotes] = React.useState("");
  const [selected, setSelected] = React.useState<Record<string, string[]>>({});

  function toggle(groupId: string, modifierId: string, multiSelect: boolean) {
    setSelected((prev) => {
      const current = prev[groupId] ?? [];
      if (multiSelect) {
        return {
          ...prev,
          [groupId]: current.includes(modifierId)
            ? current.filter((id) => id !== modifierId)
            : [...current, modifierId],
        };
      }
      return { ...prev, [groupId]: current.includes(modifierId) ? [] : [modifierId] };
    });
  }

  const missingRequired = item.modifierGroups.some((g) => g.required && !(selected[g.id]?.length > 0));

  const priceDelta = item.modifierGroups.reduce((sum, g) => {
    const ids = selected[g.id] ?? [];
    return sum + g.modifiers.filter((m) => ids.includes(m.id)).reduce((s, m) => s + m.priceDelta, 0);
  }, 0);

  const unitPrice = item.price + priceDelta;

  function handleConfirm() {
    if (missingRequired) return;
    const modifiers = item.modifierGroups.flatMap((g) =>
      (selected[g.id] ?? []).map((id) => {
        const mod = g.modifiers.find((m) => m.id === id)!;
        return { modifierId: mod.id, nameAr: mod.nameAr, nameEn: mod.nameEn, priceDelta: mod.priceDelta };
      })
    );
    onConfirm({ quantity, notes: notes.trim() || undefined, modifiers });
  }

  return (
    <Modal open onClose={onClose} title={`${item.emoji} ${locale === "ar" ? item.nameAr : item.nameEn}`}>
      <div className="flex flex-col gap-5">
        {item.modifierGroups.map((group) => (
          <div key={group.id}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-bold">{locale === "ar" ? group.nameAr : group.nameEn}</p>
              <span className="text-xs text-text-muted">{group.required ? dict.common.required : dict.common.optional}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {group.modifiers.map((mod) => {
                const active = (selected[group.id] ?? []).includes(mod.id);
                return (
                  <button
                    key={mod.id}
                    onClick={() => toggle(group.id, mod.id, group.multiSelect)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-surface text-text hover:bg-surface-2"
                    )}
                  >
                    {locale === "ar" ? mod.nameAr : mod.nameEn}
                    {mod.priceDelta !== 0 && (
                      <span className="text-xs opacity-70">
                        {mod.priceDelta > 0 ? "+" : ""}
                        {mod.priceDelta}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div>
          <p className="mb-2 text-sm font-bold">{dict.common.notes}</p>
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={dict.pos.addNote} />
        </div>

        <div className="flex items-center justify-between rounded-xl bg-surface-2 p-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-text shadow-sm cursor-pointer"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-6 text-center text-base font-bold">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-text shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <p className="text-lg font-extrabold text-primary">
            {formatMoney(unitPrice * quantity, restaurant.currency, locale)}
          </p>
        </div>

        <Button size="lg" onClick={handleConfirm} disabled={missingRequired}>
          {dict.common.add}
        </Button>
      </div>
    </Modal>
  );
}
