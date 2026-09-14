import type { Locale } from "./i18n/types";
import { getCurrencyMeta } from "./currencies";

// Force the Gregorian calendar + Latin digits for Arabic: ar-SA defaults to the
// Hijri calendar and Arabic-Indic digits in ICU, which would show confusing
// dates/numbers in a system whose underlying data is plain Gregorian.
const INTL_LOCALE: Record<Locale, string> = {
  ar: "ar-SA-u-ca-gregory-nu-latn",
  en: "en-US",
};

export function formatMoney(amount: number, currency: string, locale: Locale): string {
  const meta = getCurrencyMeta(currency);
  const formatted = new Intl.NumberFormat(INTL_LOCALE[locale], {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  }).format(amount);
  // Symbol before the amount in both locales — keeps the two LTR runs
  // (symbol, digits) in one predictable order instead of relying on bidi
  // reordering to place a trailing symbol "naturally" in an RTL sentence.
  return currency ? `${meta[locale]} ${formatted}` : formatted;
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale]).format(value);
}

export function formatDateTime(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatTime(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    timeStyle: "short",
  }).format(date);
}

export function formatDayLabel(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function minutesSince(date: Date): number {
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
}
