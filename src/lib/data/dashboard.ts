import "server-only";
import { db } from "@/lib/db";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function getDashboardStats(restaurantId: string) {
  const now = new Date();
  const rangeStart = startOfDay(new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000));

  const orders = await db.order.findMany({
    where: {
      restaurantId,
      status: { in: ["PAID"] },
      createdAt: { gte: rangeStart },
    },
    include: { items: { include: { menuItem: true } } },
  });

  const todayStart = startOfDay(now);
  const todayOrders = orders.filter((o) => o.createdAt >= todayStart);
  const todaySales = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const todayOrdersCount = todayOrders.length;
  const avgOrder = todayOrdersCount > 0 ? todaySales / todayOrdersCount : 0;

  // 14-day trend
  const trendMap = new Map<string, { revenue: number; orders: number }>();
  for (let i = 13; i >= 0; i--) {
    const day = startOfDay(new Date(now.getTime() - i * 24 * 60 * 60 * 1000));
    trendMap.set(day.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
  }
  for (const o of orders) {
    const key = startOfDay(o.createdAt).toISOString().slice(0, 10);
    const bucket = trendMap.get(key);
    if (bucket) {
      bucket.revenue += o.total;
      bucket.orders += 1;
    }
  }
  const trend = Array.from(trendMap.entries()).map(([date, v]) => ({
    date,
    revenue: Math.round(v.revenue * 100) / 100,
    orders: v.orders,
  }));

  // Top items (14-day window)
  const itemStats = new Map<
    string,
    { nameAr: string; nameEn: string; emoji: string; qty: number; revenue: number }
  >();
  let grossProfit = 0;
  for (const o of orders) {
    for (const line of o.items) {
      const key = line.menuItemId;
      const existing = itemStats.get(key) ?? {
        nameAr: line.menuItem.nameAr,
        nameEn: line.menuItem.nameEn,
        emoji: line.menuItem.emoji,
        qty: 0,
        revenue: 0,
      };
      existing.qty += line.quantity;
      existing.revenue += line.unitPrice * line.quantity;
      itemStats.set(key, existing);
      grossProfit += (line.unitPrice - line.menuItem.cost) * line.quantity;
    }
  }
  const topItems = Array.from(itemStats.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6);

  // Sales by order type (14-day window)
  const byType = { DINE_IN: 0, TAKEAWAY: 0, DELIVERY: 0 } as Record<string, number>;
  for (const o of orders) {
    byType[o.type] = (byType[o.type] ?? 0) + o.total;
  }

  const lowStock = await db.inventoryItem.findMany({
    where: { restaurantId },
    orderBy: { quantity: "asc" },
  });

  return {
    todaySales,
    todayOrdersCount,
    avgOrder,
    trend,
    topItems,
    byType,
    grossProfit,
    lowStock: lowStock.filter((i) => i.quantity <= i.lowStockAt),
  };
}
