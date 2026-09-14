"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signupAction, type SignupState } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import type { Dictionary } from "@/lib/i18n/types";

function SubmitButton({ dict }: { dict: Dictionary }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? dict.signup.submitting : dict.signup.submit}
    </Button>
  );
}

export function SignupForm({ dict }: { dict: Dictionary }) {
  const [state, formAction] = useActionState<SignupState, FormData>(signupAction, {});

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <Field label={dict.signup.restaurantName} htmlFor="restaurantName">
        <Input id="restaurantName" name="restaurantName" required placeholder="مطعم لمّة" />
      </Field>
      <Field label={dict.signup.ownerName} htmlFor="ownerName">
        <Input id="ownerName" name="ownerName" required />
      </Field>
      <Field label={dict.signup.email} htmlFor="email">
        <Input id="email" name="email" type="email" required autoComplete="email" placeholder="owner@example.com" />
      </Field>
      <Field label={dict.signup.password} htmlFor="password">
        <Input id="password" name="password" type="password" required minLength={6} autoComplete="new-password" placeholder="••••••••" />
      </Field>
      <p className="-mt-1 text-xs text-text-muted">{dict.signup.currencyNote}</p>
      {state.error && (
        <p className="text-sm font-medium text-danger">
          {state.error === "email_taken" ? dict.signup.emailTaken : dict.signup.invalid}
        </p>
      )}
      <SubmitButton dict={dict} />
    </form>
  );
}
