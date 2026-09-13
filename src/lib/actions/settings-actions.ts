"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole, MANAGEMENT_ROLES } from "@/lib/auth";

const restaurantSchema = z.object({
  name: z.string().min(1).max(120),
  currency: z.string().min(1).max(10),
  taxRate: z.number().min(0).max(100),
  address: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  logoEmoji: z.string().min(1).max(8),
});

export async function updateRestaurantAction(input: z.infer<typeof restaurantSchema>) {
  const session = await requireRole(MANAGEMENT_ROLES);
  const data = restaurantSchema.parse(input);
  await db.restaurant.update({ where: { id: session.restaurantId }, data });
  revalidatePath("/settings");
  revalidatePath("/pos");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

const userSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.email(),
  password: z.string().min(6).max(100),
  role: z.enum(["OWNER", "MANAGER", "CASHIER", "WAITER", "KITCHEN"]),
});

export async function createUserAction(input: z.infer<typeof userSchema>) {
  const session = await requireRole(MANAGEMENT_ROLES);
  const data = userSchema.parse(input);

  const existing = await db.user.findUnique({ where: { email: data.email.toLowerCase().trim() } });
  if (existing) return { ok: false as const, error: "email_taken" };

  const passwordHash = await bcrypt.hash(data.password, 10);
  await db.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase().trim(),
      passwordHash,
      role: data.role,
      restaurantId: session.restaurantId,
    },
  });
  revalidatePath("/settings");
  return { ok: true as const };
}

export async function setUserActiveAction(userId: string, active: boolean) {
  const session = await requireRole(MANAGEMENT_ROLES);
  const user = await db.user.findFirst({ where: { id: userId, restaurantId: session.restaurantId } });
  if (!user) return { ok: false as const, error: "not_found" };
  await db.user.update({ where: { id: userId }, data: { active } });
  revalidatePath("/settings");
  return { ok: true as const };
}
