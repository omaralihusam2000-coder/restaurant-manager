"use server";

import { setLocaleCookie, setThemeCookie } from "@/lib/preferences";
import type { Locale } from "@/lib/i18n/types";
import type { Theme } from "@/lib/preferences";

export async function setLocaleAction(formData: FormData) {
  const locale = formData.get("locale") === "en" ? "en" : "ar";
  await setLocaleCookie(locale as Locale);
}

export async function setThemeAction(formData: FormData) {
  const theme = formData.get("theme") === "dark" ? "dark" : "light";
  await setThemeCookie(theme as Theme);
}
