"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import type { Dictionary } from "@/lib/i18n/types";

function SubmitButton({ dict }: { dict: Dictionary }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? dict.login.submitting : dict.login.submit}
    </Button>
  );
}

export function LoginForm({ dict }: { dict: Dictionary }) {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <Field label={dict.login.email} htmlFor="email">
        <Input id="email" name="email" type="email" required autoComplete="email" placeholder="admin@lamma.com" />
      </Field>
      <Field label={dict.login.password} htmlFor="password">
        <Input id="password" name="password" type="password" required autoComplete="current-password" placeholder="••••••••" />
      </Field>
      {state.error && <p className="text-sm font-medium text-danger">{dict.login.invalidCredentials}</p>}
      <SubmitButton dict={dict} />
    </form>
  );
}
