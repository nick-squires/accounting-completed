import React, { useEffect, useState } from "react";
import { Card } from "@accounting-completed/ui";
import { useBalanceSheet, useTransactionsYears } from "@accounting-completed/api-client";
import type { BalanceSheetSection } from "@accounting-completed/contracts";
import { useClient } from "../../app/client-context";
import { PageHeader } from "../../components/PageHeader";

const money = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });
const asOfLabel = (iso: string) => {
  // asOf is the exclusive upper bound (Jan 1 of year+1); show the prior day (Dec 31 of year).
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
};

function SectionBlock({ section }: { section: BalanceSheetSection }) {
  return (
    <Card className="overflow-hidden">
      <table className="w-full text-[13.5px]">
        <thead className="bg-muted/60 border-b border-border">
          <tr>
            <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium">
              {section.label}
            </th>
            <th className="text-right px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[180px]" />
          </tr>
        </thead>
        <tbody>
          {section.groups.map((g) => (
            <React.Fragment key={g.type}>
              <tr className="bg-muted/30">
                <td className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-text-soft font-medium" colSpan={2}>
                  {g.type}
                </td>
              </tr>
              {g.accounts.map((a) => (
                <tr key={`${g.type}-${a.code}`} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                  <td className="px-3 py-2 pl-6 text-foreground">{a.name}</td>
                  <td className="px-3 py-2 text-right tnum">{money(a.amount)}</td>
                </tr>
              ))}
              <tr className="border-b border-border">
                <td className="px-3 py-1.5 pl-3 font-medium">Total {g.type}</td>
                <td className="px-3 py-1.5 text-right tnum font-medium">{money(g.subtotal)}</td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-muted/50 border-t border-border font-semibold">
            <td className="px-3 py-2">Total {section.label}</td>
            <td className="px-3 py-2 text-right tnum">{money(section.total)}</td>
          </tr>
        </tfoot>
      </table>
    </Card>
  );
}

export function BalanceSheetPage() {
  const { clientId } = useClient();
  const numericClientId = clientId ? Number(clientId) : null;

  const yearsQuery = useTransactionsYears({ clientId: numericClientId });
  const [year, setYear] = useState<number | null>(null);
  useEffect(() => {
    if (year == null && yearsQuery.data && yearsQuery.data.length > 0) {
      setYear(yearsQuery.data[0]);
    }
  }, [year, yearsQuery.data]);

  const bsQuery = useBalanceSheet({ clientId: numericClientId, year });
  const data = bsQuery.data;

  return (
    <div>
      <PageHeader
        title="Balance Sheet"
        sub={data ? `as of ${asOfLabel(data.meta.asOf)}` : undefined}
        actions={
          <label className="text-[13px] flex items-center gap-2">
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
        }
      />

      {yearsQuery.isSuccess && yearsQuery.data.length === 0 && (
        <div className="text-text-soft">No data available for this client.</div>
      )}
      {bsQuery.isLoading && <div className="text-text-soft">Loading…</div>}
      {bsQuery.isError && (
        <div className="text-destructive">
          Failed to load. <button type="button" className="underline" onClick={() => bsQuery.refetch()}>Retry</button>
        </div>
      )}

      {bsQuery.isSuccess && data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="rounded-md border border-border bg-card px-4 py-3">
              <div className="text-[11px] uppercase tracking-wider text-text-soft">Total assets</div>
              <div className="text-[20px] font-semibold tnum">{money(data.totals.assets)}</div>
            </div>
            <div className="rounded-md border border-border bg-card px-4 py-3">
              <div className="text-[11px] uppercase tracking-wider text-text-soft">Total liabilities</div>
              <div className="text-[20px] font-semibold tnum">{money(data.totals.liabilities)}</div>
            </div>
            <div className="rounded-md border border-border bg-card px-4 py-3">
              <div className="text-[11px] uppercase tracking-wider text-text-soft">Total equity</div>
              <div className="text-[20px] font-semibold tnum">{money(data.totals.equity)}</div>
            </div>
          </div>

          {data.sections.map((s) => (
            <SectionBlock key={s.key} section={s} />
          ))}

          <div className="flex items-center justify-between px-3 py-3 border-t-2 border-border font-semibold text-[14px]">
            <span>Total liabilities + equity</span>
            <span className="tnum">{money(data.totals.liabilitiesAndEquity)}</span>
          </div>

          <div className="flex items-center gap-2 px-3 text-[12.5px]">
            <span className={`inline-block w-2 h-2 rounded-full ${data.balanced ? "bg-positive" : "bg-destructive"}`} />
            {data.balanced ? (
              <span className="text-text-soft">
                Books balance: Assets <span className="font-mono text-foreground">{money(data.totals.assets)}</span> = Liabilities + Equity{" "}
                <span className="font-mono text-foreground">{money(data.totals.liabilitiesAndEquity)}</span>
              </span>
            ) : (
              <span className="text-destructive">
                Out of balance by {money(Math.round((data.totals.assets - data.totals.liabilitiesAndEquity) * 100) / 100)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
