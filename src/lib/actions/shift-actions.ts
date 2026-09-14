"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole, POS_ROLES } from "@/lib/auth";
import { getCashSalesForUser, getOpenShiftForUser } from "@/lib/data/shifts";

export async function openShiftAction(openingCash: number) {
  const session = await requireRole(POS_ROLES);
  const amount = z.number().min(0).parse(openingCash);

  const existing = await getOpenShiftForUser(session.userId);
  if (existing) return { ok: false as const, error: "already_open" };

  await db.shift.create({
    data: {
      openingCash: amount,
      restaurantId: session.restaurantId,
      userId: session.userId,
    },
  });
  revalidatePath("/shifts");
  return { ok: true as const };
}

export async function closeShiftAction(shiftId: string, closingCash: number, notes?: string) {
  const session = await requireRole(POS_ROLES);
  const amount = z.number().min(0).parse(closingCash);

  const shift = await db.shift.findFirst({
    where: { id: shiftId, userId: session.userId, restaurantId: session.restaurantId, closedAt: null },
  });
  if (!shift) return { ok: false as const, error: "not_found" };

  const closedAt = new Date();
  const cashSales = await getCashSalesForUser(session.restaurantId, session.userId, shift.openedAt, closedAt);
  const expectedCash = shift.openingCash + cashSales;

  await db.shift.update({
    where: { id: shiftId },
    data: { closedAt, closingCash: amount, expectedCash, notes: notes?.trim() || undefined },
  });
  revalidatePath("/shifts");
  return { ok: true as const, expectedCash };
}
