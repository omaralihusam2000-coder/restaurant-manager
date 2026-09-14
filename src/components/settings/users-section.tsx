"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/roles";
import { setUserActiveAction } from "@/lib/actions/settings-actions";
import { AddUserDialog } from "./add-user-dialog";
import type { Serialized } from "@/types/serialized";
import type { getUsersForRestaurant } from "@/lib/data/users";

type Users = Serialized<Awaited<ReturnType<typeof getUsersForRestaurant>>>;

export function UsersSection({ users, currentUserId }: { users: Users; currentUserId: string }) {
  const { dict, locale } = useI18n();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  async function toggleActive(userId: string, active: boolean) {
    await setUserActiveAction(userId, active);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <Button size="sm" className="self-start" onClick={() => setDialogOpen(true)}>
        <Plus className="h-4 w-4" />
        {dict.settings.addUser}
      </Button>
      <div className="flex flex-col gap-2">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-text-muted" dir="ltr">
                {user.email}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge tone="neutral">{ROLE_LABELS[user.role][locale]}</Badge>
              {user.id === currentUserId ? (
                <Badge tone="primary">{dict.settings.active}</Badge>
              ) : (
                <button
                  onClick={() => toggleActive(user.id, !user.active)}
                  className="cursor-pointer"
                  aria-label="toggle active"
                >
                  <Badge tone={user.active ? "success" : "danger"}>
                    {user.active ? dict.settings.active : dict.common.unavailable}
                  </Badge>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {dialogOpen && (
        <AddUserDialog
          onClose={() => setDialogOpen(false)}
          onSaved={() => {
            setDialogOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
