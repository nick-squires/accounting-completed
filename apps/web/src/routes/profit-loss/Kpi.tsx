export function Kpi({ label, value }: { label: string; value: number }) {
  const formatted = value.toLocaleString(undefined, { style: "currency", currency: "USD" });
  return (
    <div className="rounded-md border border-border bg-card px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-text-soft">{label}</div>
      <div className={["text-[20px] font-semibold tnum", value < 0 ? "text-destructive" : ""].join(" ")}>
        {formatted}
      </div>
    </div>
  );
}
