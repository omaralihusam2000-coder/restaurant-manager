"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { deleteCategoryAction, deleteMenuItemAction, toggleMenuItemAvailabilityAction } from "@/lib/actions/menu-actions";
import type { MenuData, ModifierGroupsData } from "@/lib/data/menu";
import type { RestaurantRecord } from "@/lib/data/restaurant";
import { CategoryDialog } from "./category-dialog";
import { ItemDialog } from "./item-dialog";
import { ModifierGroupDialog } from "./modifier-group-dialog";

type MenuItem = MenuData[number]["menuItems"][number];
type Category = MenuData[number];

export function MenuClient({
  categories,
  modifierGroups,
  restaurant,
}: {
  categories: MenuData;
  modifierGroups: ModifierGroupsData;
  restaurant: RestaurantRecord;
}) {
  const { dict, locale } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [tab, setTab] = React.useState<"items" | "modifiers">("items");
  const [activeCategoryId, setActiveCategoryId] = React.useState<string | null>(categories[0]?.id ?? null);
  const [categoryDialog, setCategoryDialog] = React.useState<{ open: boolean; category?: Category } | null>(null);
  const [itemDialog, setItemDialog] = React.useState<{ open: boolean; item?: MenuItem } | null>(null);
  const [groupDialogOpen, setGroupDialogOpen] = React.useState(false);

  const activeCategory = categories.find((c) => c.id === activeCategoryId) ?? categories[0];

  function refresh() {
    setCategoryDialog(null);
    setItemDialog(null);
    setGroupDialogOpen(false);
    router.refresh();
  }

  async function handleDeleteCategory(category: Category) {
    if (!window.confirm(dict.menu.deleteConfirm)) return;
    const result = await deleteCategoryAction(category.id);
    if (result.ok) {
      toast(dict.common.saved, "success");
      if (activeCategoryId === category.id) setActiveCategoryId(null);
      router.refresh();
    } else {
      toast(dict.common.error, "error");
    }
  }

  async function handleDeleteItem(item: MenuItem) {
    if (!window.confirm(dict.menu.deleteConfirm)) return;
    const result = await deleteMenuItemAction(item.id);
    if (result.ok) {
      toast(dict.common.saved, "success");
      router.refresh();
    } else {
      toast(dict.common.error, "error");
    }
  }

  async function handleToggleAvailability(item: MenuItem) {
    await toggleMenuItemAvailabilityAction(item.id, !item.available);
    router.refresh();
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab("items")}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold",
            tab === "items" ? "bg-primary text-primary-foreground" : "bg-surface-2 text-text-muted"
          )}
        >
          {dict.menu.items}
        </button>
        <button
          onClick={() => setTab("modifiers")}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold",
            tab === "modifiers" ? "bg-primary text-primary-foreground" : "bg-surface-2 text-text-muted"
          )}
        >
          {dict.menu.modifierGroups}
        </button>
      </div>

      {tab === "items" ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategoryId(c.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold",
                  activeCategory?.id === c.id ? "bg-primary text-primary-foreground" : "bg-surface-2 text-text-muted"
                )}
              >
                {c.emoji} {locale === "ar" ? c.nameAr : c.nameEn}
              </button>
            ))}
            <Button size="sm" variant="outline" onClick={() => setCategoryDialog({ open: true })}>
              <Plus className="h-4 w-4" />
              {dict.menu.addCategory}
            </Button>
          </div>

          {categories.length === 0 ? (
            <p className="py-10 text-center text-sm text-text-muted">{dict.menu.noCategories}</p>
          ) : (
            activeCategory && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold">{locale === "ar" ? activeCategory.nameAr : activeCategory.nameEn}</h3>
                    <button onClick={() => setCategoryDialog({ open: true, category: activeCategory })} className="text-text-muted cursor-pointer">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDeleteCategory(activeCategory)} className="text-danger cursor-pointer">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <Button size="sm" onClick={() => setItemDialog({ open: true })}>
                    <Plus className="h-4 w-4" />
                    {dict.menu.addItem}
                  </Button>
                </div>

                {activeCategory.menuItems.length === 0 ? (
                  <p className="py-10 text-center text-sm text-text-muted">{dict.menu.noItems}</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {activeCategory.menuItems.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-3 card-shadow">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-xl">
                          {item.emoji}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">{locale === "ar" ? item.nameAr : item.nameEn}</p>
                          <p className="text-sm font-semibold text-primary">{formatMoney(item.price, restaurant.currency, locale)}</p>
                          <button onClick={() => handleToggleAvailability(item)} className="mt-1 cursor-pointer">
                            <Badge tone={item.available ? "success" : "danger"}>
                              {item.available ? dict.common.available : dict.common.unavailable}
                            </Badge>
                          </button>
                        </div>
                        <div className="flex shrink-0 flex-col gap-2">
                          <button onClick={() => setItemDialog({ open: true, item })} className="text-text-muted cursor-pointer">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteItem(item)} className="text-danger cursor-pointer">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Button size="sm" className="self-start" onClick={() => setGroupDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            {dict.menu.addModifierGroup}
          </Button>
          {modifierGroups.length === 0 ? (
            <p className="py-10 text-center text-sm text-text-muted">{dict.menu.noModifierGroups}</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {modifierGroups.map((g) => (
                <div key={g.id} className="rounded-2xl border border-border bg-surface p-4 card-shadow">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">{locale === "ar" ? g.nameAr : g.nameEn}</p>
                    <div className="flex gap-1">
                      {g.required && <Badge tone="primary">{dict.common.required}</Badge>}
                      {g.multiSelect && <Badge tone="accent">☑︎</Badge>}
                    </div>
                  </div>
                  <ul className="mt-2 flex flex-col gap-1">
                    {g.modifiers.map((m) => (
                      <li key={m.id} className="flex justify-between text-xs text-text-muted">
                        <span>{locale === "ar" ? m.nameAr : m.nameEn}</span>
                        <span>{m.priceDelta !== 0 ? formatMoney(m.priceDelta, restaurant.currency, locale) : "—"}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {categoryDialog?.open && (
        <CategoryDialog category={categoryDialog.category} onClose={() => setCategoryDialog(null)} onSaved={refresh} />
      )}
      {itemDialog?.open && (
        <ItemDialog
          categories={categories}
          modifierGroups={modifierGroups}
          categoryId={activeCategory?.id ?? categories[0]?.id ?? ""}
          item={itemDialog.item}
          onClose={() => setItemDialog(null)}
          onSaved={refresh}
        />
      )}
      {groupDialogOpen && <ModifierGroupDialog onClose={() => setGroupDialogOpen(false)} onSaved={refresh} />}
    </div>
  );
}
