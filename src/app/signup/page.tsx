import Link from "next/link";
import { getLocale, getTheme } from "@/lib/preferences";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { SignupForm } from "./signup-form";
import { PreferenceSwitcher } from "@/components/layout/preference-switcher";

export default async function SignupPage() {
  const locale = await getLocale();
  const theme = await getTheme();
  const dict = getDictionary(locale);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute bottom-0 end-0 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="absolute top-4 end-4 z-10">
        <PreferenceSwitcher locale={locale} theme={theme} />
      </div>

      <div className="relative z-10 grid w-full max-w-4xl gap-6 sm:grid-cols-2 sm:gap-0 sm:overflow-hidden sm:rounded-3xl sm:border sm:border-border sm:bg-surface sm:card-shadow">
        <div className="brand-gradient hidden flex-col justify-between p-8 text-primary-foreground sm:flex">
          <div>
            <div className="text-3xl">🍽️</div>
            <h1 className="mt-4 text-2xl font-extrabold">لمّة</h1>
            <p className="mt-2 text-sm/relaxed opacity-90">{dict.signup.subtitle}</p>
          </div>
          <p className="text-sm/relaxed opacity-90">{dict.signup.afterNote}</p>
        </div>

        <div className="rounded-3xl border border-border bg-surface p-6 card-shadow sm:rounded-none sm:border-0 sm:shadow-none sm:p-8">
          <h2 className="text-xl font-bold">{dict.signup.title}</h2>
          <p className="mt-1 text-sm text-text-muted sm:hidden">{dict.signup.subtitle}</p>

          <SignupForm dict={dict} locale={locale} />

          <p className="mt-4 text-center text-sm text-text-muted">
            {dict.signup.haveAccount}{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              {dict.signup.loginLink}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
