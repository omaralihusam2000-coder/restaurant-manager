"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { cn } from "@/lib/cn";
import { I18nProvider } from "@/components/i18n-provider";
import { ToastProvider } from "@/components/ui/toast";
import { PreferenceSwitcher } from "./preference-switcher";
import { logoutAction } from "@/lib/actions/auth-actions";
import { NAV_ITEMS, type NavItem } from "./nav-items";
import type { Dictionary, Locale } from "@/lib/i18n/types";
import type { Theme } from "@/lib/preferences";
import { ROLE_LABELS } from "@/lib/roles";
import type { Role } from "@/generated/prisma/enums";

function NavLinks({ items, dict, onNavigate }: { items: NavItem[]; dict: Dictionary; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto scrollbar-thin px-3 py-2">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground shadow-sm" : "text-text-muted hover:bg-surface-2 hover:text-text"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {dict.nav[item.labelKey]}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand({ name, emoji }: { name: string; emoji: string }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-4">
      <div className="brand-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xl shadow-sm">
        {emoji}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold">{name}</p>
        <p className="text-xs text-text-muted">Restaurant POS</p>
      </div>
    </div>
  );
}

function UserBlock({ name, role, dict, locale }: { name: string; role: Role; dict: Dictionary; locale: Locale }) {
  return (
    <div className="border-t border-border p-3">
      <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-bold">
          {name.trim().charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="text-xs text-text-muted">{ROLE_LABELS[role][locale]}</p>
        </div>
      </div>
      <form action={logoutAction}>
        <button
          type="submit"
          className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          {dict.common.logout}
        </button>
      </form>
    </div>
  );
}

export function AppShell({
  dict,
  locale,
  theme,
  restaurantName,
  restaurantEmoji,
  userName,
  role,
  children,
}: {
  dict: Dictionary;
  locale: Locale;
  theme: Theme;
  restaurantName: string;
  restaurantEmoji: string;
  userName: string;
  role: Role;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const pathname = usePathname();
  const items = React.useMemo(() => NAV_ITEMS.filter((i) => i.roles.includes(role)), [role]);
  const activeItem = items.find((i) => pathname === i.href || pathname.startsWith(i.href + "/"));

  // Close the mobile drawer when the route changes. Adjusted during render
  // (rather than in an effect) to avoid an extra post-commit re-render.
  const [lastPathname, setLastPathname] = React.useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setDrawerOpen(false);
  }

  return (
    <I18nProvider locale={locale} dict={dict}>
      <ToastProvider>
        <div className="flex min-h-screen bg-background">
          {/* Desktop sidebar */}
          <aside className="hidden w-64 shrink-0 flex-col border-e border-border bg-surface sm:flex">
            <Brand name={restaurantName} emoji={restaurantEmoji} />
            <NavLinks items={items} dict={dict} />
            <UserBlock name={userName} role={role} dict={dict} locale={locale} />
          </aside>

          {/* Mobile drawer */}
          {drawerOpen && (
            <div className="fixed inset-0 z-50 flex sm:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
              <div className="relative z-10 flex h-full w-72 flex-col bg-surface shadow-2xl">
                <div className="flex items-center justify-between">
                  <Brand name={restaurantName} emoji={restaurantEmoji} />
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="me-3 rounded-full p-2 text-text-muted hover:bg-surface-2 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <NavLinks items={items} dict={dict} onNavigate={() => setDrawerOpen(false)} />
                <UserBlock name={userName} role={role} dict={dict} locale={locale} />
              </div>
            </div>
          )}

          <div className="flex min-h-screen min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="rounded-full p-2 text-text-muted hover:bg-surface-2 sm:hidden cursor-pointer"
                  aria-label="menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <h1 className="text-sm font-bold sm:text-base">{activeItem ? dict.nav[activeItem.labelKey] : restaurantName}</h1>
              </div>
              <PreferenceSwitcher locale={locale} theme={theme} />
            </header>

            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </div>
      </ToastProvider>
    </I18nProvider>
  );
}
