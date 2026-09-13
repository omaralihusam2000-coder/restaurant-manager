export type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";

export type CartModifier = {
  modifierId: string;
  nameAr: string;
  nameEn: string;
  priceDelta: number;
};

export type CartLine = {
  lineId: string;
  menuItemId: string;
  nameAr: string;
  nameEn: string;
  emoji: string;
  basePrice: number;
  quantity: number;
  notes?: string;
  modifiers: CartModifier[];
};

export function lineUnitPrice(line: CartLine): number {
  return line.basePrice + line.modifiers.reduce((s, m) => s + m.priceDelta, 0);
}

export function lineTotal(line: CartLine): number {
  return lineUnitPrice(line) * line.quantity;
}
