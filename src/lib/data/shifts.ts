import "server-only";
import { db } from "@/lib/db";

export async function getOpenShiftForUser(userId: string) {
  return db.shift.findFirst({
    where: { userId, closedAt: null },
    orderBy: { openedAt: "desc" },
  });
}

export async function getShiftsForRestaurant(restaurantId: string) {
  return db.shift.findMany({
    where: { restaurantId },
    orderBy: { openedAt: "desc" },
    take: 100,
    include: { user: true },
  });
}

/** Total cash collected on orders rung up by this user within [from, to]. */
export async function getCashSalesForUser(restaurantId: string, userId: string, from: Date, to: Date) {
  const payments = await db.payment.findMany({
    where: {
      method: "CASH",
      order: { restaurantId, userId, createdAt: { gte: from, lte: to } },
    },
    select: { amount: true },
  });
  return payments.reduce((sum, p) => sum + p.amount, 0);
}

export type ShiftsData = Awaited<ReturnType<typeof getShiftsForRestaurant>>;
export type OpenShiftData = Awaited<ReturnType<typeof getOpenShiftForUser>>;
