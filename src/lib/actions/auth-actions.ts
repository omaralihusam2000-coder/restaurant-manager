"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSessionCookie, clearSessionCookie } from "@/lib/auth";
import { getLocale } from "@/lib/preferences";
import type { Role } from "@/generated/prisma/enums";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginState = { error?: string };

function roleHome(role: Role) {
  if (role === "KITCHEN") return "/kitchen";
  if (role === "OWNER" || role === "MANAGER") return "/dashboard";
  return "/pos";
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "invalid" };
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email.toLowerCase().trim() },
  });

  if (!user || !user.active) {
    return { error: "invalid" };
  }

  const passwordOk = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!passwordOk) {
    return { error: "invalid" };
  }

  await createSessionCookie({
    userId: user.id,
    restaurantId: user.restaurantId,
    role: user.role,
    name: user.name,
    email: user.email,
  });

  redirect(roleHome(user.role));
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

const signupSchema = z.object({
  restaurantName: z.string().min(1).max(120),
  ownerName: z.string().min(1).max(120),
  email: z.email(),
  password: z.string().min(6).max(100),
});

export type SignupState = { error?: string };

export async function signupAction(_prevState: SignupState, formData: FormData): Promise<SignupState> {
  const parsed = signupSchema.safeParse({
    restaurantName: formData.get("restaurantName"),
    ownerName: formData.get("ownerName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "invalid" };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "email_taken" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const locale = await getLocale();
  const defaultZone = locale === "ar" ? "الصالة الرئيسية" : "Main Hall";

  const user = await db.$transaction(async (tx) => {
    const restaurant = await tx.restaurant.create({
      data: {
        name: parsed.data.restaurantName,
        currency: "IQD",
      },
    });

    // A handful of starter tables so the floor plan and POS are usable
    // immediately — the menu is left empty on purpose, since a real
    // restaurant's dishes and prices should be theirs, not sample data.
    await tx.table.createMany({
      data: Array.from({ length: 6 }, (_, i) => ({
        label: String(i + 1),
        zone: defaultZone,
        seats: 4,
        restaurantId: restaurant.id,
      })),
    });

    return tx.user.create({
      data: {
        name: parsed.data.ownerName,
        email,
        passwordHash,
        role: "OWNER",
        restaurantId: restaurant.id,
      },
    });
  });

  await createSessionCookie({
    userId: user.id,
    restaurantId: user.restaurantId,
    role: user.role,
    name: user.name,
    email: user.email,
  });

  redirect("/menu");
}
