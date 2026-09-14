import {
  LayoutGrid,
  Utensils,
  ChefHat,
  ClipboardList,
  BookOpenText,
  LineChart,
  Boxes,
  Settings,
  Wallet,
} from "lucide-react";
import type { Role } from "@/generated/prisma/enums";
import type { Dictionary } from "@/lib/i18n/types";

export type NavItem = {
  href: string;
  labelKey: keyof Dictionary["nav"];
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/pos", labelKey: "pos", icon: Utensils, roles: ["OWNER", "MANAGER", "CASHIER", "WAITER"] },
  { href: "/tables", labelKey: "tables", icon: LayoutGrid, roles: ["OWNER", "MANAGER", "CASHIER", "WAITER"] },
  { href: "/kitchen", labelKey: "kitchen", icon: ChefHat, roles: ["OWNER", "MANAGER", "KITCHEN"] },
  { href: "/orders", labelKey: "orders", icon: ClipboardList, roles: ["OWNER", "MANAGER", "CASHIER", "WAITER"] },
  { href: "/shifts", labelKey: "shifts", icon: Wallet, roles: ["OWNER", "MANAGER", "CASHIER", "WAITER"] },
  { href: "/dashboard", labelKey: "dashboard", icon: LineChart, roles: ["OWNER", "MANAGER"] },
  { href: "/menu", labelKey: "menu", icon: BookOpenText, roles: ["OWNER", "MANAGER"] },
  { href: "/inventory", labelKey: "inventory", icon: Boxes, roles: ["OWNER", "MANAGER"] },
  { href: "/settings", labelKey: "settings", icon: Settings, roles: ["OWNER", "MANAGER"] },
];
