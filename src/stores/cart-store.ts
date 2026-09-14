"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine, OrderType } from "@/types/cart";

type CartState = {
  orderId: string | null;
  orderType: OrderType;
  tableId: string | null;
  tableLabel: string | null;
  customerName: string;
  customerPhone: string;
  orderNotes: string;
  discount: number;
  lines: CartLine[];

  addLine: (line: Omit<CartLine, "lineId">) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  updateLineNotes: (lineId: string, notes: string) => void;
  removeLine: (lineId: string) => void;
  clear: () => void;
  setOrderType: (type: OrderType) => void;
  setTable: (tableId: string | null, tableLabel: string | null) => void;
  setCustomer: (name: string, phone: string) => void;
  setOrderNotes: (notes: string) => void;
  setDiscount: (amount: number) => void;
  loadExistingOrder: (payload: {
    orderId: string;
    tableId: string | null;
    tableLabel: string | null;
    orderType: OrderType;
    customerName: string;
    customerPhone: string;
    orderNotes: string;
    discount: number;
    lines: CartLine[];
  }) => void;
};

function makeLineId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      orderId: null,
      orderType: "DINE_IN",
      tableId: null,
      tableLabel: null,
      customerName: "",
      customerPhone: "",
      orderNotes: "",
      discount: 0,
      lines: [],

      addLine: (line) =>
        set((state) => ({ lines: [...state.lines, { ...line, lineId: makeLineId() }] })),

      updateQuantity: (lineId, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.lineId !== lineId)
              : state.lines.map((l) => (l.lineId === lineId ? { ...l, quantity } : l)),
        })),

      updateLineNotes: (lineId, notes) =>
        set((state) => ({
          lines: state.lines.map((l) => (l.lineId === lineId ? { ...l, notes } : l)),
        })),

      removeLine: (lineId) =>
        set((state) => ({ lines: state.lines.filter((l) => l.lineId !== lineId) })),

      clear: () =>
        set({
          orderId: null,
          tableId: null,
          tableLabel: null,
          customerName: "",
          customerPhone: "",
          orderNotes: "",
          discount: 0,
          lines: [],
        }),

      setOrderType: (orderType) =>
        set((state) => ({
          orderType,
          tableId: orderType === "DINE_IN" ? state.tableId : null,
          tableLabel: orderType === "DINE_IN" ? state.tableLabel : null,
        })),
      setTable: (tableId, tableLabel) => set({ tableId, tableLabel }),
      setCustomer: (customerName, customerPhone) => set({ customerName, customerPhone }),
      setOrderNotes: (orderNotes) => set({ orderNotes }),
      setDiscount: (discount) => set({ discount: Math.max(0, discount) }),

      loadExistingOrder: (payload) =>
        set({
          orderId: payload.orderId,
          tableId: payload.tableId,
          tableLabel: payload.tableLabel,
          orderType: payload.orderType,
          customerName: payload.customerName,
          customerPhone: payload.customerPhone,
          orderNotes: payload.orderNotes,
          discount: payload.discount,
          lines: payload.lines,
        }),
    }),
    { name: "rm-cart" }
  )
);
