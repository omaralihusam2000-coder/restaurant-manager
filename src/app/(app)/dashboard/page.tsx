import { Wallet, Receipt, TrendingUp, PiggyBank, PackageX } from "lucide-react";
import { requireRole, MANAGEMENT_ROLES } from "@/lib/auth";
import { getDashboardStats } from "@/lib/data/dashboard";
import { getRestaurant } from "@/lib/data/restaurant";
import { getLocale } from "@/lib/preferences";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { formatMoney, formatNumber } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { SalesTrendChart } from "@/components/dashboard/sales-trend-chart";

export default async function DashboardPage() {
  const session = await requireRole(MANAGEMENT_ROLES);
  const [stats, restaurant, locale] = await Promise.all([
    getDashboardStats(session.restaurantId),
    getRestaurant(session.restaurantId),
    getLocale(),
  ]);
  const dict = getDictionary(locale);
  const money = (v: number) => formatMoney(v, restaurant.currency, locale);

  const typeLabel = { DINE_IN: dict.pos.dineIn, TAKEAWAY: dict.pos.takeaway, DELIVERY: dict.pos.delivery };
  const maxByType = Math.max(1, ...Object.values(stats.byType));
  const maxTopItem = Math.max(1, ...stats.topItems.map((i) => i.qty));

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={dict.dashboard.todaySales} value={money(stats.todaySales)} icon={Wallet} tone="primary" />
        <StatCard label={dict.dashboard.todayOrders} value={formatNumber(stats.todayOrdersCount, locale)} icon={Receipt} tone="accent" />
        <StatCard label={dict.dashboard.avgOrder} value={money(stats.avgOrder)} icon={TrendingUp} tone="success" />
        <StatCard label={dict.dashboard.grossProfit} value={money(stats.grossProfit)} icon={PiggyBank} tone="warning" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{dict.dashboard.salesTrend}</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesTrendChart data={stats.trend} currency={restaurant.currency} locale={locale} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{dict.dashboard.salesByType}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {(Object.keys(typeLabel) as (keyof typeof typeLabel)[]).map((type) => (
              <div key={type}>
                <div className="mb-1 flex justify-between text-xs font-medium">
                  <span>{typeLabel[type]}</span>
                  <span className="text-text-muted">{money(stats.byType[type] ?? 0)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${((stats.byType[type] ?? 0) / maxByType) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{dict.dashboard.bestSellers}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {stats.topItems.length === 0 && <p className="text-sm text-text-muted">—</p>}
            {stats.topItems.map((item) => (
              <div key={item.nameEn}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span>{item.emoji}</span>
                    {locale === "ar" ? item.nameAr : item.nameEn}
                  </span>
                  <span className="text-text-muted">{formatNumber(item.qty, locale)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(item.qty / maxTopItem) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{dict.dashboard.lowStock}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {stats.lowStock.length === 0 ? (
              <p className="text-sm text-text-muted">—</p>
            ) : (
              stats.lowStock.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl bg-surface-2 p-2.5 text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <PackageX className="h-4 w-4 text-danger" />
                    {locale === "ar" ? item.nameAr : item.nameEn}
                  </span>
                  <Badge tone="danger">
                    {item.quantity} {locale === "ar" ? item.unit : item.unitEn}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
