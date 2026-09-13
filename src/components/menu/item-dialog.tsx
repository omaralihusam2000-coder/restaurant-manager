"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { saveMenuItemAction } from "@/lib/actions/menu-actions";
import type { MenuData } from "@/lib/data/menu";
import type { ModifierGroupsData } from "@/lib/data/menu";

type MenuItem = MenuData[number]["menuItems"][number];

export function ItemDialog({
  categories,
  modifierGroups,
  categoryId,
  item,
  onClose,
  onSaved,
}: {
  categories: MenuData;
  modifierGroups: ModifierGroupsData;
  categoryId: string;
  item?: MenuItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { dict, locale } = useI18n();
  const { toast } = useToast();
  const [nameAr, setNameAr] = React.useState(item?.nameAr ?? "");
  const [nameEn, setNameEn] = React.useState(item?.nameEn ?? "");
  const [price, setPrice] = React.useState(String(item?.price ?? ""));
  const [cost, setCost] = React.useState(String(item?.cost ?? "0"));
  const [emoji, setEmoji] = React.useState(item?.emoji ?? "🍽️");
  const [available, setAvailable] = React.useState(item?.available ?? true);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState(categoryId);
  const [selectedGroups, setSelectedGroups] = React.useState<string[]>(
    item?.modifierGroups.map((g) => g.modifierGroupId) ?? []
  );
  const [saving, setSaving] = React.useState(false);

  function toggleGroup(id: string) {
    setSelectedGroups((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await saveMenuItemAction({
      id: item?.id,
      categoryId: selectedCategoryId,
      nameAr,
      nameEn,
      price: Number(price) || 0,
      cost: Number(cost) || 0,
      emoji,
      available,
      modifierGroupIds: selectedGroups,
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
    <Modal open onClose={onClose} title={item ? dict.menu.editItem : dict.menu.addItem}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-3">
          <Field label={dict.menu.itemEmoji} className="w-20">
            <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} className="text-center text-lg" />
          </Field>
          <Field label={dict.menu.itemCategory} className="flex-1">
            <Select value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {locale === "ar" ? c.nameAr : c.nameEn}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label={dict.menu.itemNameAr}>
          <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} required dir="rtl" />
        </Field>
        <Field label={dict.menu.itemNameEn}>
          <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} required dir="ltr" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={dict.menu.itemPrice}>
            <Input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </Field>
          <Field label={dict.menu.itemCost}>
            <Input type="number" min={0} step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} />
          </Field>
        </div>

        {modifierGroups.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-text-muted">{dict.menu.linkedModifierGroups}</p>
            <div className="flex flex-wrap gap-2">
              {modifierGroups.map((g) => (
                <button
                  type="button"
                  key={g.id}
                  onClick={() => toggleGroup(g.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                    selectedGroups.includes(g.id)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-text-muted hover:bg-surface-2"
                  )}
                >
                  {locale === "ar" ? g.nameAr : g.nameEn}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} className="h-4 w-4" />
          {dict.menu.itemAvailable}
        </label>

        <Button type="submit" disabled={saving}>
          {saving ? dict.common.saving : dict.common.save}
        </Button>
      </form>
    </Modal>
  );
}
