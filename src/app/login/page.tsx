import Link from "next/link";
import { getLocale, getTheme } from "@/lib/preferences";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { LoginForm } from "./login-form";
import { PreferenceSwitcher } from "@/components/layout/preference-switcher";

export default async function LoginPage() {
  const locale = await getLocale();
  const theme = await getTheme();
  const dict = getDictionary(locale);

  const demoAccounts = [
    { email: "admin@lamma.com", role: locale === "ar" ? "مالك" : "Owner" },
    { email: "cashier@lamma.com", role: locale === "ar" ? "كاشير" : "Cashier" },
    { email: "waiter@lamma.com", role: locale === "ar" ? "نادل" : "Waiter" },
    { email: "kitchen@lamma.com", role: locale === "ar" ? "مطبخ" : "Kitchen" },
  ];

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
            <p className="mt-2 text-sm/relaxed opacity-90">{dict.login.subtitle}</p>
          </div>
          <ul className="space-y-2 text-sm opacity-90">
            <li>• {locale === "ar" ? "نقطة بيع سريعة وسهلة" : "Fast, easy point of sale"}</li>
            <li>• {locale === "ar" ? "خريطة طاولات وشاشة مطبخ مباشرة" : "Live table map & kitchen display"}</li>
            <li>• {locale === "ar" ? "تقارير مبيعات لحظية" : "Real-time sales dashboard"}</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-border bg-surface p-6 card-shadow sm:rounded-none sm:border-0 sm:shadow-none sm:p-8">
          <h2 className="text-xl font-bold">{dict.login.title}</h2>
          <p className="mt-1 text-sm text-text-muted sm:hidden">{dict.login.subtitle}</p>

          <LoginForm dict={dict} />

          <p className="mt-4 text-center text-sm text-text-muted">
            {dict.login.noAccount}{" "}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              {dict.login.signupLink}
            </Link>
          </p>

          <div className="mt-6 rounded-xl bg-surface-2 p-3">
            <p className="text-xs font-semibold text-text-muted">{dict.login.demoAccounts}</p>
            <ul className="mt-2 grid grid-cols-2 gap-1.5 text-xs text-text-muted">
              {demoAccounts.map((a) => (
                <li key={a.email} className="truncate">
                  <span className="font-medium text-text">{a.role}</span>: {a.email}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-text-muted">{dict.login.demoHint}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
