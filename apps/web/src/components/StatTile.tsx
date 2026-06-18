import type { ReactNode } from "react";
import { Sparkline } from "@accounting-completed/ui";

interface StatTileProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  intent?: "warning" | "positive" | "accent" | "destructive";
  spark?: number[];
  sparkColor?: string;
}

export function StatTile({ label, value, sub, intent, spark, sparkColor }: StatTileProps) {
  const vc =
    intent === "warning"     ? "text-warning" :
    intent === "positive"    ? "text-positive" :
    intent === "accent"      ? "text-primary" :
    intent === "destructive" ? "text-destructive" :
                               "text-foreground";

  return (
    <div className="bg-card border border-border rounded-lg shadow-elev-xs p-5 relative overflow-hidden">
      <div className="text-[11px] font-medium uppercase tracking-wider text-text-soft mb-3">{label}</div>
      <div className={`font-mono tnum text-[28px] leading-none font-medium tracking-tight ${vc}`}>{value}</div>
      {sub && <div className="text-[12px] text-muted-foreground mt-2">{sub}</div>}
      {spark && (
        <div className="absolute right-4 top-4 opacity-70">
          <Sparkline values={spark} color={sparkColor ?? "hsl(var(--primary))"} />
        </div>
      )}
    </div>
  );
}
