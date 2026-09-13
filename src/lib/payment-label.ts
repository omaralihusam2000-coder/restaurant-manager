import type { PaymentMethod } from "@/generated/prisma/enums";
import type { Dictionary } from "@/lib/i18n/types";

export function paymentMethodLabel(method: PaymentMethod, dict: Dictionary): string {
  return { CASH: dict.pos.cash, CARD: dict.pos.card, WALLET: dict.pos.wallet }[method];
}
