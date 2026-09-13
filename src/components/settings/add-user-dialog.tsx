"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { ROLE_LABELS } from "@/lib/roles";
import { createUserAction } from "@/lib/actions/settings-actions";
import type { Role } from "@/generated/prisma/enums";

const ASSIGNABLE_ROLES: Role[] = ["MANAGER", "CASHIER", "WAITER", "KITCHEN"];

export function AddUserDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { dict, locale } = useI18n();
  const { toast } = useToast();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<Role>("CASHIER");
  const [saving, setSaving] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await createUserAction({ name, email, password, role });
    setSaving(false);
    if (result.ok) {
      toast(dict.common.saved, "success");
      onSaved();
    } else {
      toast(result.error === "email_taken" ? dict.login.invalidCredentials : dict.common.error, "error");
    }
  }

  return (
    <Modal open onClose={onClose} title={dict.settings.addUser}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label={dict.settings.userName}>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label={dict.settings.userEmail}>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" required />
        </Field>
        <Field label={dict.settings.userPassword}>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        </Field>
        <Field label={dict.settings.role}>
          <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {ASSIGNABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r][locale]}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit" disabled={saving}>
          {saving ? dict.common.saving : dict.common.save}
        </Button>
      </form>
    </Modal>
  );
}
