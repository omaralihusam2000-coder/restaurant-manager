import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "primary" | "accent" | "success" | "warning";
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            tone === "primary" && "bg-primary/15 text-primary",
            tone === "accent" && "bg-accent/15 text-accent",
            tone === "success" && "bg-success/15 text-success",
            tone === "warning" && "bg-warning/15 text-warning"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-text-muted">{label}</p>
          <p className="text-lg font-extrabold sm:text-xl">{value}</p>
        </div>
      </div>
    </Card>
  );
}
