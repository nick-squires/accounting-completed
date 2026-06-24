import type { Transaction } from "@accounting-completed/contracts";

export type TxnTab = "review" | "categorized" | "excluded" | "all";

export function filterTransactions(txns: Transaction[], tab: TxnTab, query: string): Transaction[] {
  const q = query.trim().toLowerCase();
  return txns.filter((t) => {
    if (tab !== "all" && t.status !== tab) return false;
    if (!q) return true;
    const hay = [t.payee, t.memo, t.category, String(t.amount)]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}
