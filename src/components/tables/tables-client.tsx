"use client";

import * as React from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { setTableStatusAction } from "@/lib/actions/order-actions";
import type { TablesData } from "@/lib/data/tables";
import type { TableStatus } from "@/generated/prisma/enums";

const STATUS_STYLES: Record<TableStatus, string> = {
  AVAILABLE: "border-success/40 bg-success/5",
  OCCUPIED: "border-danger/40 bg-danger/5",
  RESERVED: "border-warning/40 bg-warning/5",
};

const STATUS_TONE: Record<TableStatus, "success" | "danger" | "warning"> = {
  AVAILABLE: "success",
  OCCUPIED: "danger",
  RESERVED: "warning",
};

const STATUS_DOT: Record<TableStatus, string> = {
  AVAILABLE: "bg-success",
  OCCUPIED: "bg-danger",
  RESERVED: "bg-warning",
};

export function TablesClient({ tables: initialTables }: { tables: TablesData }) {
  const { dict } = useI18n();
  const [tables, setTables] = React.useState(initialTables);

  // Re-sync local (optimistically-updated) state whenever the server passes
  // fresh data, e.g. after a router.refresh(). Done during render — not in
  // an effect — to avoid an extra post-commit re-render.
  const [syncedTables, setSyncedTables] = React.useState(initialTables);
  if (initialTables !== syncedTables) {
    setSyncedTables(initialTables);
    setTables(initialTables);
  }

  const zones = React.useMemo(() => {
    const map = new Map<string, TablesData>();
    for (const t of tables) {
      const list = map.get(t.zone) ?? [];
      list.push(t);
      map.set(t.zone, list);
    }
    return Array.from(map.entries());
  }, [tables]);

  const statusLabel: Record<TableStatus, string> = {
    AVAILABLE: dict.tables.available,
    OCCUPIED: dict.tables.occupied,
    RESERVED: dict.tables.reserved,
  };

  async function cycleStatus(tableId: string, current: TableStatus) {
    const order: TableStatus[] = ["AVAILABLE", "OCCUPIED", "RESERVED"];
    const next = order[(order.indexOf(current) + 1) % order.length];
    setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, status: next } : t)));
    await setTableStatusAction(tableId, next);
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-text-muted">
        <span className="font-semibold text-text">{dict.tables.legend}:</span>
        {(["AVAILABLE", "OCCUPIED", "RESERVED"] as TableStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={cn("h-2.5 w-2.5 rounded-full", STATUS_DOT[s])} />
            {statusLabel[s]}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        {zones.map(([zone, zoneTables]) => (
          <div key={zone}>
            <h3 className="mb-3 text-sm font-bold text-text-muted">{zone || dict.tables.noZone}</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {zoneTables.map((table) => (
                <div
                  key={table.id}
                  className={cn("flex flex-col gap-2 rounded-2xl border-2 p-3.5 card-shadow", STATUS_STYLES[table.status])}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xl font-extrabold">{table.label}</span>
                    <button onClick={() => cycleStatus(table.id, table.status)} className="cursor-pointer">
                      <Badge tone={STATUS_TONE[table.status]}>{statusLabel[table.status]}</Badge>
                    </button>
                  </div>
                  <p className="flex items-center gap-1 text-xs text-text-muted">
                    <Users className="h-3.5 w-3.5" />
                    {table.seats} {dict.tables.seats}
                  </p>
                  <Link href={`/pos?tableId=${table.id}`} className="mt-1">
                    <Button size="sm" variant={table.status === "OCCUPIED" ? "secondary" : "primary"} className="w-full">
                      {table.status === "OCCUPIED" ? dict.tables.openOrder : dict.tables.startOrder}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
        {tables.length === 0 && <p className="text-sm text-text-muted">—</p>}
      </div>
    </div>
  );
}
