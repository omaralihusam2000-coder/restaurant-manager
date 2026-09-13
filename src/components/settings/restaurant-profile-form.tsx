"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { updateRestaurantAction } from "@/lib/actions/settings-actions";
import type { RestaurantRecord } from "@/lib/data/restaurant";

export function RestaurantProfileForm({ restaurant }: { restaurant: RestaurantRecord }) {
  const { dict } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [form, setForm] = React.useState({
    name: restaurant.name,
    logoEmoji: restaurant.logoEmoji,
    currency: restaurant.currency,
    taxRate: String(restaurant.taxRate),
    address: restaurant.address ?? "",
    phone: restaurant.phone ?? "",
  });
  const [saving, setSaving] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await updateRestaurantAction({
      name: form.name,
      logoEmoji: form.logoEmoji,
      currency: form.currency,
      taxRate: Number(form.taxRate) || 0,
      address: form.address || undefined,
      phone: form.phone || undefined,
    });
    setSaving(false);
    if (result.ok) {
      toast(dict.common.saved, "success");
      router.refresh();
    } else {
      toast(dict.common.error, "error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex gap-3">
        <Field label={dict.menu.itemEmoji} className="w-20">
          <Input
            value={form.logoEmoji}
            onChange={(e) => setForm((f) => ({ ...f, logoEmoji: e.target.value }))}
            maxLength={4}
            className="text-center text-lg"
          />
        </Field>
        <Field label={dict.settings.restaurantName} className="flex-1">
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={dict.settings.currency}>
          <Input value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} required />
        </Field>
        <Field label={dict.settings.taxRate}>
          <Input
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={form.taxRate}
            onChange={(e) => setForm((f) => ({ ...f, taxRate: e.target.value }))}
          />
        </Field>
      </div>
      <Field label={dict.settings.address}>
        <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
      </Field>
      <Field label={dict.settings.phone}>
        <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} dir="ltr" />
      </Field>
      <Button type="submit" className="self-start" disabled={saving}>
        {saving ? dict.common.saving : dict.common.save}
      </Button>
    </form>
  );
}
