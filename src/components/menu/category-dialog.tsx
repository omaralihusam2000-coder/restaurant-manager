"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { saveCategoryAction } from "@/lib/actions/menu-actions";

export function CategoryDialog({
  category,
  onClose,
  onSaved,
}: {
  category?: { id: string; nameAr: string; nameEn: string; emoji: string };
  onClose: () => void;
  onSaved: () => void;
}) {
  const { dict } = useI18n();
  const { toast } = useToast();
  const [nameAr, setNameAr] = React.useState(category?.nameAr ?? "");
  const [nameEn, setNameEn] = React.useState(category?.nameEn ?? "");
  const [emoji, setEmoji] = React.useState(category?.emoji ?? "🍴");
  const [saving, setSaving] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await saveCategoryAction({ id: category?.id, nameAr, nameEn, emoji });
    setSaving(false);
    if (result.ok) {
      toast(dict.common.saved, "success");
      onSaved();
    } else {
      toast(dict.common.error, "error");
    }
  }

  return (
    <Modal open onClose={onClose} title={category ? dict.menu.editCategory : dict.menu.addCategory}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label={dict.menu.itemEmoji}>
          <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} className="w-20 text-center text-lg" />
        </Field>
        <Field label={dict.menu.categoryNameAr}>
          <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} required dir="rtl" />
        </Field>
        <Field label={dict.menu.categoryNameEn}>
          <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} required dir="ltr" />
        </Field>
        <Button type="submit" disabled={saving}>
          {saving ? dict.common.saving : dict.common.save}
        </Button>
      </form>
    </Modal>
  );
}
