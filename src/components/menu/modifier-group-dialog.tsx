"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { saveModifierGroupAction } from "@/lib/actions/menu-actions";

type Row = { nameAr: string; nameEn: string; priceDelta: string };

export function ModifierGroupDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { dict } = useI18n();
  const { toast } = useToast();
  const [nameAr, setNameAr] = React.useState("");
  const [nameEn, setNameEn] = React.useState("");
  const [required, setRequired] = React.useState(false);
  const [multiSelect, setMultiSelect] = React.useState(false);
  const [rows, setRows] = React.useState<Row[]>([{ nameAr: "", nameEn: "", priceDelta: "0" }]);
  const [saving, setSaving] = React.useState(false);

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const modifiers = rows
      .filter((r) => r.nameAr.trim() && r.nameEn.trim())
      .map((r) => ({ nameAr: r.nameAr, nameEn: r.nameEn, priceDelta: Number(r.priceDelta) || 0 }));
    if (modifiers.length === 0) {
      toast(dict.common.error, "error");
      return;
    }
    setSaving(true);
    const result = await saveModifierGroupAction({ nameAr, nameEn, required, multiSelect, modifiers });
    setSaving(false);
    if (result.ok) {
      toast(dict.common.saved, "success");
      onSaved();
    } else {
      toast(dict.common.error, "error");
    }
  }

  return (
    <Modal open onClose={onClose} title={dict.menu.addModifierGroup}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label={dict.menu.groupNameAr}>
          <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} required dir="rtl" />
        </Field>
        <Field label={dict.menu.groupNameEn}>
          <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} required dir="ltr" />
        </Field>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="h-4 w-4" />
            {dict.menu.groupRequired}
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={multiSelect} onChange={(e) => setMultiSelect(e.target.checked)} className="h-4 w-4" />
            {dict.menu.groupMultiSelect}
          </label>
        </div>

        <div className="flex flex-col gap-2">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                placeholder={dict.menu.optionNameAr}
                value={row.nameAr}
                onChange={(e) => updateRow(i, { nameAr: e.target.value })}
                dir="rtl"
              />
              <Input
                placeholder={dict.menu.optionNameEn}
                value={row.nameEn}
                onChange={(e) => updateRow(i, { nameEn: e.target.value })}
                dir="ltr"
              />
              <Input
                type="number"
                step="0.01"
                placeholder={dict.menu.optionPrice}
                value={row.priceDelta}
                onChange={(e) => updateRow(i, { priceDelta: e.target.value })}
                className="w-24"
              />
              <button
                type="button"
                onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
                className="shrink-0 text-danger cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setRows((prev) => [...prev, { nameAr: "", nameEn: "", priceDelta: "0" }])}
            className="flex items-center gap-1.5 self-start rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-semibold cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            {dict.menu.addOption}
          </button>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? dict.common.saving : dict.common.save}
        </Button>
      </form>
    </Modal>
  );
}
