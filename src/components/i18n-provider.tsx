"use client";

import * as React from "react";
import type { Dictionary, Locale } from "@/lib/i18n/types";

const I18nContext = React.createContext<{ locale: Locale; dict: Dictionary; dir: "rtl" | "ltr" } | null>(null);

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: React.ReactNode;
}) {
  const value = React.useMemo(
    () => ({ locale, dict, dir: (locale === "ar" ? "rtl" : "ltr") as "rtl" | "ltr" }),
    [locale, dict]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
