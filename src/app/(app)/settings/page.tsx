import { requireRole, MANAGEMENT_ROLES } from "@/lib/auth";
import { getRestaurant } from "@/lib/data/restaurant";
import { getUsersForRestaurant } from "@/lib/data/users";
import { getLocale, getTheme } from "@/lib/preferences";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { setLocaleAction, setThemeAction } from "@/lib/actions/preferences-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RestaurantProfileForm } from "@/components/settings/restaurant-profile-form";
import { UsersSection } from "@/components/settings/users-section";

export default async function SettingsPage() {
  const session = await requireRole(MANAGEMENT_ROLES);
  const [restaurant, users, locale, theme] = await Promise.all([
    getRestaurant(session.restaurantId),
    getUsersForRestaurant(session.restaurantId),
    getLocale(),
    getTheme(),
  ]);
  const dict = getDictionary(locale);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>{dict.settings.restaurantProfile}</CardTitle>
        </CardHeader>
        <CardContent>
          <RestaurantProfileForm restaurant={restaurant} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{dict.settings.language}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-xl bg-surface-2 p-3">
            <span className="text-sm font-medium">{dict.settings.language}</span>
            <form action={setLocaleAction}>
              <input type="hidden" name="locale" value={locale === "ar" ? "en" : "ar"} />
              <button type="submit" className="rounded-lg bg-surface px-3 py-1.5 text-sm font-semibold shadow-sm cursor-pointer">
                {locale === "ar" ? dict.settings.english : dict.settings.arabic}
              </button>
            </form>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-surface-2 p-3">
            <span className="text-sm font-medium">{dict.settings.theme}</span>
            <form action={setThemeAction}>
              <input type="hidden" name="theme" value={theme === "dark" ? "light" : "dark"} />
              <button type="submit" className="rounded-lg bg-surface px-3 py-1.5 text-sm font-semibold shadow-sm cursor-pointer">
                {theme === "dark" ? dict.settings.light : dict.settings.dark}
              </button>
            </form>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{dict.settings.users}</CardTitle>
        </CardHeader>
        <CardContent>
          <UsersSection users={JSON.parse(JSON.stringify(users))} currentUserId={session.userId} />
        </CardContent>
      </Card>
    </div>
  );
}
