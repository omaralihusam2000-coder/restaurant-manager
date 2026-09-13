"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole, MANAGEMENT_ROLES } from "@/lib/auth";

const itemSchema = z.object({
  nameAr: z.string().min(1).max(120),
  nameEn: z.string().min(1).max(120),
  unit: z.string().min(1).max(30),
  quantity: z.number().min(0),
  lowStockAt: z.number().min(0),
});

export async function createInventoryItemAction(input: z.infer<typeof itemSchema>) {
  const session = await requireRole(MANAGEMENT_ROLES);
  const data = itemSchema.parse(input);
  await db.inventoryItem.create({ data: { ...data, restaurantId: session.restaurantId } });
  revalidatePath("/inventory");
  return { ok: true as const };
}

export async function updateInventoryQuantityAction(id: string, quantity: number) {
  const session = await requireRole(MANAGEMENT_ROLES);
  const item = await db.inventoryItem.findFirst({ where: { id, restaurantId: session.restaurantId } });
  if (!item) return { ok: false as const, error: "not_found" };
  await db.inventoryItem.update({ where: { id }, data: { quantity } });
  revalidatePath("/inventory");
  return { ok: true as const };
}

export async function deleteInventoryItemAction(id: string) {
  const session = await requireRole(MANAGEMENT_ROLES);
  const item = await db.inventoryItem.findFirst({ where: { id, restaurantId: session.restaurantId } });
  if (!item) return { ok: false as const, error: "not_found" };
  await db.inventoryItem.delete({ where: { id } });
  revalidatePath("/inventory");
  return { ok: true as const };
}
