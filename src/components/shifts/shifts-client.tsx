"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Wallet, Lock, Unlock } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Textarea } from "@/components/ui/input";
import { formatMoney, formatDateTime } from "@/lib/format";
import { openShiftAction, closeShiftAction } from "@/lib/actions/shift-actions";
import type { RestaurantRecord } from "@/lib/data/restaurant";
import type { OpenShiftData, ShiftsData } from "@/lib/data/shifts";
import type { Serialized } from "@/types/serialized";

function OpenShiftCard({ restaurant, onOpened }: { restaurant: RestaurantRecord; onOpened: () => void }) {
  const { dict, locale } = useI18n();
  const { toast } = useToast();
  const [amount, setAmount] = React.useState("0");
  const [saving, setSaving] = React.useState(false);

  async function handleOpen() {
    setSaving(true);
    const result = await openShiftAction(Number(amount) || 0);
    setSaving(false);
    if (result.ok) {
      toast(dict.shifts.shiftOpened, "success");
      onOpened();
    } else {
      toast(result.error === "already_open" ? dict.shifts.alreadyOpen : dict.common.error, "error");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Unlock className="h-5 w-5 text-primary" />
          {dict.shifts.openShift}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-text-muted">{dict.shifts.noOpenShift}</p>
        <Field label={dict.shifts.openingCash}>
          <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Button className="self-start" onClick={handleOpen} disabled={saving}>
          {saving ? dict.common.saving : dict.shifts.openShift}
        </Button>
        <p className="text-xs text-text-muted">
          {locale === "ar" ? `العملة: ${restaurant.currency}` : `Currency: ${restaurant.currency}`}
        </p>
      </CardContent>
    </Card>
  );
}

function CloseShiftDialog({
  shiftId,
  expectedSoFar,
  restaurant,
  onClose,
  onClosed,
}: {
  shiftId: string;
  expectedSoFar: number;
  restaurant: RestaurantRecord;
  onClose: () => void;
  onClosed: () => void;
}) {
  const { dict, locale } = useI18n();
  const { toast } = useToast();
  const [closingCash, setClosingCash] = React.useState(String(expectedSoFar));
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const diff = (Number(closingCash) || 0) - expectedSoFar;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await closeShiftAction(shiftId, Number(closingCash) || 0, notes);
    setSaving(false);
    if (result.ok) {
      toast(dict.shifts.shiftClosed, "success");
      onClosed();
    } else {
      toast(dict.common.error, "error");
    }
  }

  return (
    <Modal open onClose={onClose} title={dict.shifts.closeShift}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="rounded-xl bg-surface-2 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">{dict.shifts.expectedCash}</span>
            <span className="font-bold">{formatMoney(expectedSoFar, restaurant.currency, locale)}</span>
          </div>
        </div>
        <Field label={dict.shifts.closingCash}>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={closingCash}
            onChange={(e) => setClosingCash(e.target.value)}
            autoFocus
          />
        </Field>
        <div className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2 text-sm font-bold">
          <span>{dict.shifts.difference}</span>
          <span className={diff === 0 ? "" : diff > 0 ? "text-success" : "text-danger"}>
            {diff === 0
              ? dict.shifts.balanced
              : `${diff > 0 ? "+" : ""}${formatMoney(diff, restaurant.currency, locale)} (${diff > 0 ? dict.shifts.over : dict.shifts.short})`}
          </span>
        </div>
        <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={dict.shifts.notesPlaceholder} />
        <Button type="submit" disabled={saving}>
          {saving ? dict.common.saving : dict.shifts.closeShift}
        </Button>
      </form>
    </Modal>
  );
}

export function ShiftsClient({
  restaurant,
  currentShift,
  cashSoFar,
  history,
  showHistory,
}: {
  restaurant: RestaurantRecord;
  currentShift: Serialized<OpenShiftData>;
  cashSoFar: number;
  history: Serialized<ShiftsData>;
  showHistory: boolean;
}) {
  const { dict, locale } = useI18n();
  const router = useRouter();
  const [closeDialogOpen, setCloseDialogOpen] = React.useState(false);

  const expectedSoFar = currentShift ? currentShift.openingCash + cashSoFar : 0;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 sm:p-6">
      {!currentShift ? (
        <OpenShiftCard restaurant={restaurant} onOpened={() => router.refresh()} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              {dict.shifts.currentShift}
            </CardTitle>
            <Badge tone="success">{dict.shifts.ongoing}</Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-text-muted">{dict.shifts.openedAt}</p>
                <p className="font-semibold">{formatDateTime(new Date(currentShift.openedAt), locale)}</p>
              </div>
              <div>
                <p className="text-text-muted">{dict.shifts.openingCash}</p>
                <p className="font-semibold">{formatMoney(currentShift.openingCash, restaurant.currency, locale)}</p>
              </div>
              <div>
                <p className="text-text-muted">{dict.shifts.cashSales}</p>
                <p className="font-semibold">{formatMoney(cashSoFar, restaurant.currency, locale)}</p>
              </div>
              <div>
                <p className="text-text-muted">{dict.shifts.expectedCash}</p>
                <p className="font-bold text-primary">{formatMoney(expectedSoFar, restaurant.currency, locale)}</p>
              </div>
            </div>
            <Button variant="danger" className="self-start" onClick={() => setCloseDialogOpen(true)}>
              <Lock className="h-4 w-4" />
              {dict.shifts.closeShift}
            </Button>
          </CardContent>
        </Card>
      )}

      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle>{dict.shifts.history}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {history.length === 0 && <p className="text-sm text-text-muted">—</p>}
            {history.map((shift) => {
              const diff = shift.closingCash != null && shift.expectedCash != null ? shift.closingCash - shift.expectedCash : null;
              return (
                <div key={shift.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm">
                  <div>
                    <p className="font-semibold">{shift.user.name}</p>
                    <p className="text-xs text-text-muted">
                      {formatDateTime(new Date(shift.openedAt), locale)}
                      {shift.closedAt ? ` → ${formatDateTime(new Date(shift.closedAt), locale)}` : ` (${dict.shifts.ongoing})`}
                    </p>
                  </div>
                  {diff != null ? (
                    <Badge tone={diff === 0 ? "neutral" : diff > 0 ? "warning" : "danger"}>
                      {diff === 0
                        ? dict.shifts.balanced
                        : `${diff > 0 ? "+" : ""}${formatMoney(diff, restaurant.currency, locale)}`}
                    </Badge>
                  ) : (
                    <Badge tone="success">{dict.shifts.ongoing}</Badge>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {closeDialogOpen && currentShift && (
        <CloseShiftDialog
          shiftId={currentShift.id}
          expectedSoFar={expectedSoFar}
          restaurant={restaurant}
          onClose={() => setCloseDialogOpen(false)}
          onClosed={() => {
            setCloseDialogOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
