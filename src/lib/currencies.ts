// Currency display metadata: the localized symbol/abbreviation to show, and
// how many decimal places actually get used in practice. Storage is always
// the plain ISO code (Restaurant.currency, e.g. "IQD") — this only affects
// formatting. An unknown code falls back to itself with 2 decimals.
export type CurrencyMeta = { ar: string; en: string; decimals: number };

export const CURRENCY_META: Record<string, CurrencyMeta> = {
  // Iraqi Dinar is this product's primary currency — prices are shown as
  // whole dinars, matching how every till and menu in Iraq actually prices
  // things (nobody prices or tenders fils).
  IQD: { ar: "د.ع", en: "IQD", decimals: 0 },
  SAR: { ar: "ر.س", en: "SAR", decimals: 2 },
  AED: { ar: "د.إ", en: "AED", decimals: 2 },
  KWD: { ar: "د.ك", en: "KWD", decimals: 3 },
  QAR: { ar: "ر.ق", en: "QAR", decimals: 2 },
  BHD: { ar: "د.ب", en: "BHD", decimals: 3 },
  OMR: { ar: "ر.ع", en: "OMR", decimals: 3 },
  EGP: { ar: "ج.م", en: "EGP", decimals: 2 },
  JOD: { ar: "د.أ", en: "JOD", decimals: 3 },
  USD: { ar: "$", en: "USD", decimals: 2 },
  EUR: { ar: "€", en: "EUR", decimals: 2 },
};

export function getCurrencyMeta(code: string): CurrencyMeta {
  return CURRENCY_META[code] ?? { ar: code, en: code, decimals: 2 };
}
