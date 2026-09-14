import { requireRole, POS_ROLES, MANAGEMENT_ROLES } from "@/lib/auth";
import { getOpenShiftForUser, getShiftsForRestaurant, getCashSalesForUser } from "@/lib/data/shifts";
import { getRestaurant } from "@/lib/data/restaurant";
import { ShiftsClient } from "@/components/shifts/shifts-client";

export default async function ShiftsPage() {
  const session = await requireRole(POS_ROLES);
  const [restaurant, currentShift] = await Promise.all([
    getRestaurant(session.restaurantId),
    getOpenShiftForUser(session.userId),
  ]);

  const cashSoFar = currentShift
    ? await getCashSalesForUser(session.restaurantId, session.userId, currentShift.openedAt, new Date())
    : 0;

  const isManager = MANAGEMENT_ROLES.includes(session.role);
  const history = isManager ? await getShiftsForRestaurant(session.restaurantId) : [];

  return (
    <ShiftsClient
      restaurant={JSON.parse(JSON.stringify(restaurant))}
      currentShift={JSON.parse(JSON.stringify(currentShift))}
      cashSoFar={cashSoFar}
      history={JSON.parse(JSON.stringify(history))}
      showHistory={isManager}
    />
  );
}
