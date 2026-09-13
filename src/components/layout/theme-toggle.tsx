import { Moon, Sun } from "lucide-react";
import { setThemeAction } from "@/lib/actions/preferences-actions";
import type { Theme } from "@/lib/preferences";

export function ThemeToggle({ theme }: { theme: Theme }) {
  const nextTheme: Theme = theme === "dark" ? "light" : "dark";

  return (
    <form action={setThemeAction}>
      <input type="hidden" name="theme" value={nextTheme} />
      <button
        type="submit"
        aria-label="toggle theme"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text shadow-sm hover:bg-surface-2 cursor-pointer"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    </form>
  );
}
