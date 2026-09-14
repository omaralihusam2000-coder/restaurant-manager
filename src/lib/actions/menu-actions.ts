"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole, MANAGEMENT_ROLES } from "@/lib/auth";

const categorySchema = z.object({
  id: z.string().optional(),
  nameAr: z.string().min(1).max(80),
  nameEn: z.string().min(1).max(80),
  emoji: z.string().min(1).max(8).default("🍴"),
});

export async function saveCategoryAction(input: z.infer<typeof categorySchema>) {
  const session = await requireRole(MANAGEMENT_ROLES);
  const data = categorySchema.parse(input);

  if (data.id) {
    const existing = await db.category.findFirst({ where: { id: data.id, restaurantId: session.restaurantId } });
    if (!existing) return { ok: false as const, error: "not_found" };
    await db.category.update({ where: { id: data.id }, data });
  } else {
    const count = await db.category.count({ where: { restaurantId: session.restaurantId } });
    await db.category.create({
      data: { ...data, sortOrder: count, restaurantId: session.restaurantId },
    });
  }
  revalidatePath("/menu");
  revalidatePath("/pos");
  return { ok: true as const };
}

export async function deleteCategoryAction(id: string) {
  const session = await requireRole(MANAGEMENT_ROLES);
  const existing = await db.category.findFirst({ where: { id, restaurantId: session.restaurantId } });
  if (!existing) return { ok: false as const, error: "not_found" };
  await db.category.delete({ where: { id } });
  revalidatePath("/menu");
  revalidatePath("/pos");
  return { ok: true as const };
}

const menuItemSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string(),
  nameAr: z.string().min(1).max(120),
  nameEn: z.string().min(1).max(120),
  price: z.number().min(0),
  cost: z.number().min(0).default(0),
  emoji: z.string().min(1).max(8).default("🍽️"),
  available: z.boolean().default(true),
  modifierGroupIds: z.array(z.string()).default([]),
});

export async function saveMenuItemAction(input: z.infer<typeof menuItemSchema>) {
  const session = await requireRole(MANAGEMENT_ROLES);
  const data = menuItemSchema.parse(input);

  const category = await db.category.findFirst({
    where: { id: data.categoryId, restaurantId: session.restaurantId },
  });
  if (!category) return { ok: false as const, error: "category_not_found" };

  if (data.id) {
    const existing = await db.menuItem.findFirst({ where: { id: data.id, restaurantId: session.restaurantId } });
    if (!existing) return { ok: false as const, error: "not_found" };

    await db.$transaction(async (tx) => {
      await tx.menuItem.update({
        where: { id: data.id },
        data: {
          categoryId: data.categoryId,
          nameAr: data.nameAr,
          nameEn: data.nameEn,
          price: data.price,
          cost: data.cost,
          emoji: data.emoji,
          available: data.available,
        },
      });
      await tx.menuItemModifierGroup.deleteMany({ where: { menuItemId: data.id } });
      if (data.modifierGroupIds.length) {
        await tx.menuItemModifierGroup.createMany({
          data: data.modifierGroupIds.map((modifierGroupId) => ({
            menuItemId: data.id!,
            modifierGroupId,
          })),
        });
      }
    });
  } else {
    const count = await db.menuItem.count({ where: { categoryId: data.categoryId } });
    await db.menuItem.create({
      data: {
        categoryId: data.categoryId,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        price: data.price,
        cost: data.cost,
        emoji: data.emoji,
        available: data.available,
        sortOrder: count,
        restaurantId: session.restaurantId,
        modifierGroups: data.modifierGroupIds.length
          ? { create: data.modifierGroupIds.map((modifierGroupId) => ({ modifierGroupId })) }
          : undefined,
      },
    });
  }

  revalidatePath("/menu");
  revalidatePath("/pos");
  return { ok: true as const };
}

export async function deleteMenuItemAction(id: string) {
  const session = await requireRole(MANAGEMENT_ROLES);
  const existing = await db.menuItem.findFirst({ where: { id, restaurantId: session.restaurantId } });
  if (!existing) return { ok: false as const, error: "not_found" };
  await db.menuItem.delete({ where: { id } });
  revalidatePath("/menu");
  revalidatePath("/pos");
  return { ok: true as const };
}

export async function toggleMenuItemAvailabilityAction(id: string, available: boolean) {
  const session = await requireRole(MANAGEMENT_ROLES);
  const existing = await db.menuItem.findFirst({ where: { id, restaurantId: session.restaurantId } });
  if (!existing) return { ok: false as const, error: "not_found" };
  await db.menuItem.update({ where: { id }, data: { available } });
  revalidatePath("/menu");
  revalidatePath("/pos");
  return { ok: true as const };
}

const modifierGroupSchema = z.object({
  nameAr: z.string().min(1).max(80),
  nameEn: z.string().min(1).max(80),
  required: z.boolean().default(false),
  multiSelect: z.boolean().default(false),
  modifiers: z
    .array(
      z.object({
        nameAr: z.string().min(1),
        nameEn: z.string().min(1),
        priceDelta: z.number(),
      })
    )
    .min(1),
});

export async function saveModifierGroupAction(input: z.infer<typeof modifierGroupSchema>) {
  const session = await requireRole(MANAGEMENT_ROLES);
  const data = modifierGroupSchema.parse(input);
  await db.modifierGroup.create({
    data: {
      nameAr: data.nameAr,
      nameEn: data.nameEn,
      required: data.required,
      multiSelect: data.multiSelect,
      restaurantId: session.restaurantId,
      modifiers: { create: data.modifiers },
    },
  });
  revalidatePath("/menu");
  return { ok: true as const };
}
