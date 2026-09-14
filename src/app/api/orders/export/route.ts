import { NextRequest, NextResponse } from "next/server";
import { getSession, MANAGEMENT_ROLES } from "@/lib/auth";
import { db } from "@/lib/db";
import type { OrderStatus } from "@/generated/prisma/enums";

function csvEscape(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || !MANAGEMENT_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get("status") as OrderStatus | "ALL" | "ACTIVE" | null;
  const activeStatuses: OrderStatus[] = ["OPEN", "IN_KITCHEN", "READY", "SERVED"];
  const where =
    status === "ACTIVE"
      ? { status: { in: activeStatuses } }
      : status && status !== "ALL"
        ? { status }
        : {};

  const orders = await db.order.findMany({
    where: { restaurantId: session.restaurantId, ...where },
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: { table: true, user: true, payments: true },
  });

  const header = [
    "Order #",
    "Date",
    "Type",
    "Table",
    "Cashier",
    "Status",
    "Subtotal",
    "Discount",
    "Tax",
    "Total",
    "Payment method",
  ];
  const rows = orders.map((o) => [
    o.orderNumber,
    o.createdAt.toISOString(),
    o.type,
    o.table?.label ?? "",
    o.user?.name ?? "",
    o.status,
    o.subtotal.toFixed(2),
    o.discount.toFixed(2),
    o.taxAmount.toFixed(2),
    o.total.toFixed(2),
    o.payments[0]?.method ?? "",
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  // Prepend a BOM so Excel opens UTF-8 Arabic text correctly.
  const body = "﻿" + csv;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
