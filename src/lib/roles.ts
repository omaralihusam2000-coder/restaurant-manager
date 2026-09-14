import type { Role } from "@/generated/prisma/enums";

// Pure data — safe to import from both server and client code.

export const ROLE_LABELS: Record<Role, { ar: string; en: string }> = {
  OWNER: { ar: "مالك", en: "Owner" },
  MANAGER: { ar: "مدير", en: "Manager" },
  CASHIER: { ar: "كاشير", en: "Cashier" },
  WAITER: { ar: "نادل", en: "Waiter" },
  KITCHEN: { ar: "مطبخ", en: "Kitchen" },
};

/** Roles allowed to manage the restaurant (menu, users, settings, reports). */
export const MANAGEMENT_ROLES: Role[] = ["OWNER", "MANAGER"];

/** Roles allowed to operate the point of sale. */
export const POS_ROLES: Role[] = ["OWNER", "MANAGER", "CASHIER", "WAITER"];

/** Roles allowed to see the kitchen display. */
export const KITCHEN_ROLES: Role[] = ["OWNER", "MANAGER", "KITCHEN"];
