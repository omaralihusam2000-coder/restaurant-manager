"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSessionCookie, clearSessionCookie } from "@/lib/auth";
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
