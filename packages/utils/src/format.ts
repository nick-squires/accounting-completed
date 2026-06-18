export function fmt(n: number): string {
  if (n === 0) return "—";
  const s = Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return n < 0 ? `(${s})` : s;
}

export function fmtPct(n: number | null): string {
  if (n === null || Number.isNaN(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}
