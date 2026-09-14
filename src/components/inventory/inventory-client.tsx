"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus, Trash2 } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Field, Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import {
  createInventoryItemAction,
  updateInventoryQuantityAction,
  deleteInventoryItemAction,
} from "@/lib/actions/inventory-actions";
import type { getInventoryForRestaurant } from "@/lib/data/inventory";

type Items = Awaited<ReturnType<typeof getInventoryForRestaurant>>;

function AddInventoryDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { dict } = useI18n();
  const { toast } = useToast();
  const [form, setForm] = React.useState({ nameAr: "", nameEn: "", unit: "", unitEn: "", quantity: "0", lowStockAt: "5" });
  const [saving, setSaving] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await createInventoryItemAction({
      nameAr: form.nameAr,
      nameEn: form.nameEn,
      unit: form.unit,
      unitEn: form.unitEn,
      quantity: Number(form.quantity) || 0,
      lowStockAt: Number(form.lowStockAt) || 0,
    });
    setSaving(false);
    if (result.ok) {
      toast(dict.common.saved, "success");
      onSaved();
    } else {
      toast(dict.common.error, "error");
    }
  }

  return (
    <Modal open onClose={onClose} title={dict.inventory.addItem}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label={dict.menu.itemNameAr}>
          <Input value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} required dir="rtl" />
        </Field>
        <Field label={dict.menu.itemNameEn}>
          <Input value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} required dir="ltr" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`${dict.inventory.unit} (AR)`}>
            <Input value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} required dir="rtl" />
          </Field>
          <Field label={`${dict.inventory.unit} (EN)`}>
            <Input value={form.unitEn} onChange={(e) => setForm((f) => ({ ...f, unitEn: e.target.value }))} required dir="ltr" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={dict.inventory.quantity}>
            <Input type="number" min={0} value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
          </Field>
          <Field label={dict.inventory.lowStockAt}>
            <Input
              type="number"
              min={0}
              value={form.lowStockAt}
              onChange={(e) => setForm((f) => ({ ...f, lowStockAt: e.target.value }))}
            />
          </Field>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? dict.common.saving : dict.common.save}
        </Button>
      </form>
    </Modal>
  );
}

export function InventoryClient({ items }: { items: Items }) {
  const { dict, locale } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  async function adjust(id: string, current: number, delta: number) {
    const next = Math.max(0, current + delta);
    await updateInventoryQuantityAction(id, next);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(dict.menu.deleteConfirm)) return;
    const result = await deleteInventoryItemAction(id);
    if (result.ok) {
      toast(dict.common.saved, "success");
      router.refresh();
    } else {
      toast(dict.common.error, "error");
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <Button size="sm" className="mb-4" onClick={() => setDialogOpen(true)}>
        <Plus className="h-4 w-4" />
        {dict.inventory.addItem}
      </Button>

      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const low = item.quantity <= item.lowStockAt;
          return (
            <div
              key={item.id}
              className={cn("flex items-center justify-between gap-3 rounded-xl border p-3", low ? "border-danger/40 bg-danger/5" : "border-border")}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{locale === "ar" ? item.nameAr : item.nameEn}</p>
                <p className="text-xs text-text-muted">
                  {dict.inventory.unit}: {locale === "ar" ? item.unit : item.unitEn} · {dict.inventory.lowStockAt}: {item.lowStockAt}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone={low ? "danger" : "success"}>{low ? dict.inventory.lowStock : dict.inventory.ok}</Badge>
                <div className="flex items-center gap-1.5 rounded-lg bg-surface-2 px-1.5 py-1">
                  <button onClick={() => adjust(item.id, item.quantity, -1)} className="flex h-6 w-6 items-center justify-center rounded-md bg-surface cursor-pointer">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-10 text-center text-sm font-bold">{item.quantity}</span>
                  <button onClick={() => adjust(item.id, item.quantity, 1)} className="flex h-6 w-6 items-center justify-center rounded-md bg-surface cursor-pointer">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button onClick={() => handleDelete(item.id)} className="text-danger cursor-pointer">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
        {items.length === 0 && <p className="py-10 text-center text-sm text-text-muted">—</p>}
      </div>

      {dialogOpen && (
        <AddInventoryDialog
          onClose={() => setDialogOpen(false)}
          onSaved={() => {
            setDialogOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
