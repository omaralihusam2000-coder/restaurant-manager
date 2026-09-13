import "server-only";
import { cookies } from "next/headers";
import type { Locale } from "./i18n/types";

export type Theme = "light" | "dark";

const LOCALE_COOKIE = "rm_locale";
const THEME_COOKIE = "rm_theme";
const YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return value === "en" ? "en" : "ar";
}

export async function getTheme(): Promise<Theme> {
  const cookieStore = await cookies();
  const value = cookieStore.get(THEME_COOKIE)?.value;
  return value === "dark" ? "dark" : "light";
}

export async function setLocaleCookie(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, { path: "/", maxAge: YEAR_SECONDS });
}

export async function setThemeCookie(theme: Theme) {
  const cookieStore = await cookies();
  cookieStore.set(THEME_COOKIE, theme, { path: "/", maxAge: YEAR_SECONDS });
}
