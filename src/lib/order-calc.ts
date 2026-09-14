// Pure order-total math shared between the client-side cart preview and the
// authoritative server action, so the numbers the cashier sees always match
// what actually gets charged.

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeOrderTotals(subtotal: number, discount: number, taxRatePercent: number) {
  const safeDiscount = Math.min(Math.max(0, discount), subtotal);
  const taxable = Math.max(0, subtotal - safeDiscount);
  const taxAmount = round2(taxable * (taxRatePercent / 100));
  const total = round2(taxable + taxAmount);
  return { subtotal: round2(subtotal), discount: round2(safeDiscount), taxAmount, total };
}
