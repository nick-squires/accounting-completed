import { useEffect, useMemo, useState } from "react";
import { Button, Card, CardFooter } from "@accounting-completed/ui";
import { useMe, useClients, useTransactions, useTransactionsYears } from "@accounting-completed/api-client";
import { cn } from "@accounting-completed/utils";
import { ICONS } from "../../layout/icons";
import { PageHeader } from "../../components/PageHeader";
import { useClient } from "../../app/client-context";
import { filterTransactions, type TxnTab } from "./filter";

const money = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });
const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export function TransactionsPage() {
  const [tab, setTab] = useState<TxnTab>("review");
  const [q, setQ] = useState("");

  const { data: me } = useMe();
  const isStaff = me?.roles?.isStaff ?? false;
  const { data: clients } = useClients({ enabled: isStaff });
  const { clientId } = useClient();
  const numericClientId = clientId ? Number(clientId) : null;
  const clientName = isStaff
    ? clients?.find((c) => c.id === clientId)?.name
    : me?.companyName?.trim() || undefined;

  const yearsQuery = useTransactionsYears({ clientId: numericClientId });
  const [year, setYear] = useState<number | null>(null);
  useEffect(() => {
    if (year == null && yearsQuery.data && yearsQuery.data.length > 0) {
      setYear(yearsQuery.data[0]);
    }
  }, [year, yearsQuery.data]);

  const txnsQuery = useTransactions({ clientId: numericClientId, year });
  const all = txnsQuery.data?.transactions ?? [];
  const rows = useMemo(() => filterTransactions(all, tab, q), [all, tab, q]);

  const tabs: { v: TxnTab; l: string }[] = [
    { v: "review", l: "For review" },
    { v: "categorized", l: "Categorized" },
    { v: "excluded", l: "Excluded" },
    { v: "all", l: "All" },
  ];

  return (
    <div>
      <PageHeader
        title="Transactions"
        sub={clientName || undefined}
        actions={
          <>
            <Button>{ICONS.refresh}<span>Refresh feeds</span></Button>
            <Button>{ICONS.zap}<span>Rules</span></Button>
            <Button>{ICONS.download}<span>Export</span></Button>
            <Button variant="primary">{ICONS.plus}<span>Add transaction</span></Button>
          </>
        }
      />

      {/* Tab strip */}
      <div className="flex items-center justify-between gap-4 mb-4 border-b border-border">
        <div className="flex items-center gap-1">
          {tabs.map((opt) => (
            <button
              key={opt.v}
              onClick={() => setTab(opt.v)}
              className={cn(
                "px-3 py-2.5 text-[13.5px] font-medium border-b-2 -mb-px transition-colors",
                tab === opt.v
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.l}
            </button>
          ))}
        </div>
        <label className="text-[13px] flex items-center gap-2 pb-1.5">
          Year
          <select
            className="rounded-md border border-border bg-card px-2 py-1"
            value={year ?? ""}
            onChange={(e) => setYear(Number(e.target.value))}
            disabled={!yearsQuery.data || yearsQuery.data.length === 0}
          >
            {(yearsQuery.data ?? []).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[280px] max-w-md">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-soft">{ICONS.search}</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search descriptions, memos, amounts…"
            className="w-full h-8 pl-8 pr-3 rounded-md bg-card border border-border text-[13.5px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-[13.5px]">
          <thead className="bg-muted/60 border-b border-border">
            <tr>
              <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[90px]">Date</th>
              <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium">Description</th>
              <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[220px]">Category</th>
              <th className="text-right px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[140px]">Amount</th>
            </tr>
          </thead>
          <tbody>
            {txnsQuery.isLoading && (
              <tr><td colSpan={4} className="px-3 py-16 text-center text-text-soft">Loading…</td></tr>
            )}
            {txnsQuery.isError && (
              <tr><td colSpan={4} className="px-3 py-16 text-center text-destructive">
                Failed to load. <button className="underline" onClick={() => txnsQuery.refetch()}>Retry</button>
              </td></tr>
            )}
            {txnsQuery.isSuccess && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-16 text-center">
                  <div className="text-foreground font-medium text-[14px]">No transactions</div>
                  <div className="text-[13px] text-muted-foreground mt-1">
                    Nothing matches this tab or search for {year ?? "this year"}.
                  </div>
                </td>
              </tr>
            )}
            {txnsQuery.isSuccess && rows.map((tx) => (
              <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                <td className="px-3 py-2 text-text-soft whitespace-nowrap">{day(tx.postedDate)}</td>
                <td className="px-3 py-2">
                  <div className="text-foreground">{tx.payee ?? "—"}</div>
                  {tx.memo && <div className="text-[12px] text-text-soft">{tx.memo}</div>}
                </td>
                <td className="px-3 py-2 text-text-soft">{tx.category ?? "Uncategorized"}</td>
                <td className={cn("px-3 py-2 text-right tnum", tx.amount < 0 ? "text-destructive" : "")}>
                  {money(tx.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <CardFooter>
          <div className="flex items-center justify-between w-full text-[12.5px] text-muted-foreground">
            <span>
              Showing <span className="font-mono text-foreground">{rows.length}</span>{" "}
              {rows.length === 1 ? "transaction" : "transactions"}
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
