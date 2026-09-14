import { requireSession } from "@/lib/auth";
import { getRestaurant } from "@/lib/data/restaurant";
import { getLocale, getTheme } from "@/lib/preferences";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const [restaurant, locale, theme] = await Promise.all([
    getRestaurant(session.restaurantId),
    getLocale(),
    getTheme(),
  ]);
  const dict = getDictionary(locale);

  return (
    <AppShell
      dict={dict}
      locale={locale}
      theme={theme}
      restaurantName={restaurant.name}
      restaurantEmoji={restaurant.logoEmoji}
      userName={session.name}
      role={session.role}
    >
      {children}
    </AppShell>
  );
}
