import { Languages } from "lucide-react";
import { setLocaleAction } from "@/lib/actions/preferences-actions";
import type { Locale } from "@/lib/i18n/types";
import { ThemeToggle } from "./theme-toggle";
import type { Theme } from "@/lib/preferences";

export function PreferenceSwitcher({ locale, theme }: { locale: Locale; theme?: Theme }) {
  const nextLocale: Locale = locale === "ar" ? "en" : "ar";

  return (
    <div className="flex items-center gap-2">
      <form action={setLocaleAction}>
        <input type="hidden" name="locale" value={nextLocale} />
        <button
          type="submit"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-semibold text-text shadow-sm hover:bg-surface-2 cursor-pointer"
        >
          <Languages className="h-4 w-4" />
          {nextLocale === "ar" ? "العربية" : "English"}
        </button>
      </form>
      {theme && <ThemeToggle theme={theme} />}
    </div>
  );
}
