"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatDayLabel, formatMoney } from "@/lib/format";
import type { Locale } from "@/lib/i18n/types";

type Point = { date: string; revenue: number; orders: number };

function TrendTooltip({
  active,
  payload,
  currency,
  locale,
}: {
  active?: boolean;
  payload?: { payload: Point }[];
  currency: string;
  locale: Locale;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="font-bold text-text">{formatMoney(point.revenue, currency, locale)}</p>
      <p className="text-text-muted">{formatDayLabel(new Date(point.date), locale)}</p>
    </div>
  );
}

export function SalesTrendChart({
  data,
  currency,
  locale,
}: {
  data: Point[];
  currency: string;
  locale: Locale;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="0" />
        <XAxis
          dataKey="date"
          tickFormatter={(d: string) => formatDayLabel(new Date(d), locale)}
          tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
          axisLine={false}
          tickLine={false}
          width={36}
          tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 100) / 10}K` : String(v))}
        />
        <Tooltip content={<TrendTooltip currency={currency} locale={locale} />} cursor={{ stroke: "var(--color-border)" }} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-primary)"
          strokeWidth={2}
          fill="url(#revenueFill)"
          dot={false}
          activeDot={{ r: 4, stroke: "var(--color-surface)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
