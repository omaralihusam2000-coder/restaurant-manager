"use client";

import * as React from "react";
import { Banknote, CreditCard, Wallet } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import type { RestaurantRecord } from "@/lib/data/restaurant";

type Method = "CASH" | "CARD" | "WALLET";

export function PaymentDialog({
  total,
  restaurant,
  pending,
  onClose,
  onConfirm,
}: {
  total: number;
  restaurant: RestaurantRecord;
  pending: boolean;
  onClose: () => void;
  onConfirm: (payment: { method: Method; tenderedAmount?: number }) => void;
}) {
  const { dict, locale } = useI18n();
  const [method, setMethod] = React.useState<Method>("CASH");
  const [tendered, setTendered] = React.useState(String(total));

  const tenderedAmount = Number(tendered) || 0;
  const change = Math.max(0, tenderedAmount - total);
  const insufficient = method === "CASH" && tenderedAmount < total;

  const quickAmounts = React.useMemo(() => {
    const roundedUp = Math.ceil(total / 10) * 10;
    return Array.from(new Set([total, roundedUp, roundedUp + 20, roundedUp + 50])).filter((n) => n > 0);
  }, [total]);

  const methods: { key: Method; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "CASH", label: dict.pos.cash, icon: Banknote },
    { key: "CARD", label: dict.pos.card, icon: CreditCard },
    { key: "WALLET", label: dict.pos.wallet, icon: Wallet },
  ];

  return (
    <Modal open onClose={onClose} title={dict.pos.payment}>
      <div className="flex flex-col gap-5">
        <p className="text-center text-3xl font-extrabold text-primary">
          {formatMoney(total, restaurant.currency, locale)}
        </p>

        <div className="grid grid-cols-3 gap-2">
          {methods.map((m) => (
            <button
              key={m.key}
              onClick={() => setMethod(m.key)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-semibold transition-colors cursor-pointer",
                method === m.key ? "border-primary bg-primary/10 text-primary" : "border-border text-text-muted hover:bg-surface-2"
              )}
            >
              <m.icon className="h-5 w-5" />
              {m.label}
            </button>
          ))}
        </div>

        {method === "CASH" && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-muted">{dict.pos.amountTendered}</label>
            <Input
              type="number"
              min={0}
              value={tendered}
              onChange={(e) => setTendered(e.target.value)}
              className="text-lg font-bold"
            />
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setTendered(String(amount))}
                  className="rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold hover:bg-border cursor-pointer"
                >
                  {formatMoney(amount, restaurant.currency, locale)}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2 text-sm font-bold">
              <span>{dict.pos.change}</span>
              <span className={change > 0 ? "text-success" : ""}>{formatMoney(change, restaurant.currency, locale)}</span>
            </div>
          </div>
        )}

        <Button
          size="lg"
          disabled={pending || insufficient}
          onClick={() => onConfirm({ method, tenderedAmount: method === "CASH" ? tenderedAmount : total })}
        >
          {pending ? dict.common.saving : dict.pos.confirmPayment}
        </Button>
      </div>
    </Modal>
  );
}
