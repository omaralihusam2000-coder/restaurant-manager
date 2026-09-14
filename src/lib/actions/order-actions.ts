"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole, POS_ROLES, KITCHEN_ROLES } from "@/lib/auth";
import { computeOrderTotals } from "@/lib/order-calc";

const lineSchema = z.object({
  menuItemId: z.string(),
  quantity: z.number().int().min(1).max(50),
  notes: z.string().max(300).optional(),
  modifierIds: z.array(z.string()).default([]),
});

const submitOrderSchema = z.object({
  orderId: z.string().optional(),
  type: z.enum(["DINE_IN", "TAKEAWAY", "DELIVERY"]),
  tableId: z.string().optional().nullable(),
  customerName: z.string().max(120).optional(),
  customerPhone: z.string().max(30).optional(),
  notes: z.string().max(300).optional(),
  discount: z.number().min(0).default(0),
  lines: z.array(lineSchema).min(1),
  mode: z.enum(["kitchen", "pay"]),
  payment: z
    .object({
      method: z.enum(["CASH", "CARD", "WALLET"]),
      tenderedAmount: z.number().min(0).optional(),
    })
    .optional(),
});

export type SubmitOrderInput = z.infer<typeof submitOrderSchema>;
export type SubmitOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

export async function submitOrderAction(input: SubmitOrderInput): Promise<SubmitOrderResult> {
  const session = await requireRole(POS_ROLES);
  const parsed = submitOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid_input" };
  }
  const data = parsed.data;

  if (data.mode === "pay" && !data.payment) {
    return { ok: false, error: "payment_required" };
  }

  const restaurant = await db.restaurant.findUnique({ where: { id: session.restaurantId } });
  if (!restaurant) return { ok: false, error: "restaurant_not_found" };

  // Re-price every line from the database — never trust client-submitted prices.
  const menuItems = await db.menuItem.findMany({
    where: {
      id: { in: data.lines.map((l) => l.menuItemId) },
      restaurantId: session.restaurantId,
    },
  });
  const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));

  const allModifierIds = Array.from(new Set(data.lines.flatMap((l) => l.modifierIds)));
  const modifiers = allModifierIds.length
    ? await db.modifier.findMany({
        where: {
          id: { in: allModifierIds },
          modifierGroup: { restaurantId: session.restaurantId },
        },
      })
    : [];
  const modifierMap = new Map(modifiers.map((m) => [m.id, m]));

  let subtotal = 0;
  const preparedLines: {
    menuItemId: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
    modifierIds: string[];
  }[] = [];

  for (const line of data.lines) {
    const menuItem = menuItemMap.get(line.menuItemId);
    if (!menuItem) {
      return { ok: false, error: "item_not_found" };
    }
    const priceDelta = line.modifierIds.reduce((sum, id) => sum + (modifierMap.get(id)?.priceDelta ?? 0), 0);
    const unitPrice = Math.round((menuItem.price + priceDelta) * 100) / 100;
    subtotal += unitPrice * line.quantity;
    preparedLines.push({
      menuItemId: menuItem.id,
      quantity: line.quantity,
      unitPrice,
      notes: line.notes,
      modifierIds: line.modifierIds,
    });
  }

  const { discount, taxAmount, total } = computeOrderTotals(subtotal, data.discount, restaurant.taxRate);

  if (data.type === "DINE_IN" && data.tableId) {
    const table = await db.table.findFirst({
      where: { id: data.tableId, restaurantId: session.restaurantId },
    });
    if (!table) return { ok: false, error: "table_not_found" };
  }

  const status = data.mode === "pay" ? "PAID" : "IN_KITCHEN";

  try {
    const orderId = await db.$transaction(async (tx) => {
      let orderId = data.orderId;

      if (orderId) {
        const existing = await tx.order.findFirst({
          where: { id: orderId, restaurantId: session.restaurantId },
        });
        if (!existing) throw new Error("order_not_found");
        await tx.orderItem.deleteMany({ where: { orderId } });
        await tx.order.update({
          where: { id: orderId },
          data: {
            type: data.type,
            tableId: data.type === "DINE_IN" ? data.tableId ?? null : null,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            notes: data.notes,
            subtotal,
            discount,
            taxAmount,
            total,
            status,
            paidAt: data.mode === "pay" ? new Date() : existing.paidAt,
          },
        });
      } else {
        // Compute the order number on the same transaction client so the
        // read-then-write is actually atomic (using the outer `db` here
        // would race with concurrent checkouts).
        const last = await tx.order.findFirst({
          where: { restaurantId: session.restaurantId },
          orderBy: { orderNumber: "desc" },
          select: { orderNumber: true },
        });
        const orderNumber = (last?.orderNumber ?? 0) + 1;
        const created = await tx.order.create({
          data: {
            orderNumber,
            type: data.type,
            tableId: data.type === "DINE_IN" ? data.tableId ?? null : null,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            notes: data.notes,
            subtotal,
            discount,
            taxAmount,
            total,
            status,
            paidAt: data.mode === "pay" ? new Date() : null,
            restaurantId: session.restaurantId,
            userId: session.userId,
          },
        });
        orderId = created.id;
      }

      for (const line of preparedLines) {
        await tx.orderItem.create({
          data: {
            orderId: orderId!,
            menuItemId: line.menuItemId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            notes: line.notes,
            modifiers: {
              create: line.modifierIds.map((modifierId) => ({
                modifierId,
                priceDelta: modifierMap.get(modifierId)?.priceDelta ?? 0,
              })),
            },
          },
        });
      }

      if (data.payment) {
        await tx.payment.create({
          data: {
            orderId: orderId!,
            method: data.payment.method,
            amount: total,
            tenderedAmount: data.payment.tenderedAmount ?? total,
            changeAmount: Math.max(0, (data.payment.tenderedAmount ?? total) - total),
          },
        });
      }

      if (data.type === "DINE_IN" && data.tableId) {
        await tx.table.update({
          where: { id: data.tableId },
          data: { status: data.mode === "pay" ? "AVAILABLE" : "OCCUPIED" },
        });
      }

      return orderId!;
    }, { timeout: 15000 });

    revalidatePath("/orders");
    revalidatePath("/kitchen");
    revalidatePath("/tables");
    revalidatePath("/dashboard");

    return { ok: true, orderId };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "server_error" };
  }
}

const kitchenStatusSchema = z.enum(["QUEUED", "COOKING", "READY", "SERVED"]);

export async function updateKitchenItemStatusAction(orderItemId: string, status: z.infer<typeof kitchenStatusSchema>) {
  const session = await requireRole(KITCHEN_ROLES);
  const parsedStatus = kitchenStatusSchema.parse(status);

  const item = await db.orderItem.findFirst({
    where: { id: orderItemId, order: { restaurantId: session.restaurantId } },
    include: { order: { include: { items: true } } },
  });
  if (!item) return { ok: false as const, error: "not_found" };

  await db.orderItem.update({ where: { id: orderItemId }, data: { kitchenStatus: parsedStatus } });

  const siblingStatuses = item.order.items.map((i) => (i.id === orderItemId ? parsedStatus : i.kitchenStatus));
  let orderStatus: "IN_KITCHEN" | "READY" | "SERVED" | undefined;
  if (siblingStatuses.every((s) => s === "SERVED")) orderStatus = "SERVED";
  else if (siblingStatuses.some((s) => s === "COOKING")) orderStatus = "IN_KITCHEN";
  else if (siblingStatuses.every((s) => s === "READY" || s === "SERVED")) orderStatus = "READY";

  if (orderStatus && item.order.status !== "PAID" && item.order.status !== "CANCELLED") {
    await db.order.update({ where: { id: item.order.id }, data: { status: orderStatus } });
  }

  revalidatePath("/kitchen");
  revalidatePath("/orders");
  return { ok: true as const };
}

export async function cancelOrderAction(orderId: string) {
  const session = await requireRole(POS_ROLES);
  const order = await db.order.findFirst({ where: { id: orderId, restaurantId: session.restaurantId } });
  if (!order) return { ok: false as const, error: "not_found" };

  await db.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
  if (order.tableId) {
    await db.table.update({ where: { id: order.tableId }, data: { status: "AVAILABLE" } });
  }
  revalidatePath("/orders");
  revalidatePath("/tables");
  revalidatePath("/kitchen");
  return { ok: true as const };
}

/** Void-returning variant for direct use as a `<form action>` handler. */
export async function cancelOrderFormAction(orderId: string): Promise<void> {
  await cancelOrderAction(orderId);
}

const tableStatusSchema = z.enum(["AVAILABLE", "OCCUPIED", "RESERVED"]);

export async function setTableStatusAction(tableId: string, status: z.infer<typeof tableStatusSchema>) {
  const session = await requireRole(POS_ROLES);
  const parsedStatus = tableStatusSchema.parse(status);
  const table = await db.table.findFirst({ where: { id: tableId, restaurantId: session.restaurantId } });
  if (!table) return { ok: false as const, error: "not_found" };
  await db.table.update({ where: { id: tableId }, data: { status: parsedStatus } });
  revalidatePath("/tables");
  return { ok: true as const };
}
