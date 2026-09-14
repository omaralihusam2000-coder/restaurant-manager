"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signupAction, type SignupState } from "@/lib/actions/auth-actions";
import { SIGNUP_CURRENCIES } from "@/lib/currencies";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import type { Dictionary, Locale } from "@/lib/i18n/types";

const CURRENCY_LABELS: Record<(typeof SIGNUP_CURRENCIES)[number], { ar: string; en: string }> = {
  SAR: { ar: "﷼ ريال سعودي", en: "SAR — Saudi Riyal" },
  AED: { ar: "درهم إماراتي", en: "AED — UAE Dirham" },
  KWD: { ar: "دينار كويتي", en: "KWD — Kuwaiti Dinar" },
  QAR: { ar: "ريال قطري", en: "QAR — Qatari Riyal" },
  BHD: { ar: "دينار بحريني", en: "BHD — Bahraini Dinar" },
  OMR: { ar: "ريال عماني", en: "OMR — Omani Rial" },
  EGP: { ar: "جنيه مصري", en: "EGP — Egyptian Pound" },
  JOD: { ar: "دينار أردني", en: "JOD — Jordanian Dinar" },
  IQD: { ar: "دينار عراقي", en: "IQD — Iraqi Dinar" },
  USD: { ar: "دولار أمريكي", en: "USD — US Dollar" },
  EUR: { ar: "يورو", en: "EUR — Euro" },
};

function SubmitButton({ dict }: { dict: Dictionary }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? dict.signup.submitting : dict.signup.submit}
    </Button>
  );
}

export function SignupForm({ dict, locale }: { dict: Dictionary; locale: Locale }) {
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
      <Field label={dict.signup.currency} htmlFor="currency">
        <Select id="currency" name="currency" defaultValue="SAR" required>
          {SIGNUP_CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {CURRENCY_LABELS[code][locale]}
            </option>
          ))}
        </Select>
      </Field>
      {state.error && (
        <p className="text-sm font-medium text-danger">
          {state.error === "email_taken" ? dict.signup.emailTaken : dict.signup.invalid}
        </p>
      )}
      <SubmitButton dict={dict} />
    </form>
  );
}
