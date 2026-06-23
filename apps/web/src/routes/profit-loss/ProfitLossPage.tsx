import { useEffect, useState } from "react";
import { useIncomeStatement, useIncomeStatementYears } from "@accounting-completed/api-client";
import { useClient } from "../../app/client-context";
import { Kpi } from "./Kpi";
import { PLTable } from "./PLTable";

export function ProfitLossPage() {
  const { clientId } = useClient();
  const numericClientId = clientId ? Number(clientId) : null;

  const yearsQuery = useIncomeStatementYears({ clientId: numericClientId });
  const [year, setYear] = useState<number | null>(null);

  // Default to the latest available year once years load.
  useEffect(() => {
    if (year == null && yearsQuery.data && yearsQuery.data.length > 0) {
      setYear(yearsQuery.data[0]);
    }
  }, [year, yearsQuery.data]);

  const statementQuery = useIncomeStatement({ clientId: numericClientId, year });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[18px] font-semibold">Profit &amp; Loss</h1>
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
      </div>

      {yearsQuery.isSuccess && yearsQuery.data.length === 0 && (
        <div className="text-text-soft">No data available for this client.</div>
      )}
      {statementQuery.isLoading && <div className="text-text-soft">Loading…</div>}
      {statementQuery.isError && (
        <div className="text-destructive">
          Failed to load. <button className="underline" onClick={() => statementQuery.refetch()}>Retry</button>
        </div>
      )}
      {statementQuery.isSuccess && (
        statementQuery.data.sections.every((s) => s.accounts.length === 0) ? (
          <div className="text-text-soft">No income statement data for this client and year.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi label="Total Income" value={statementQuery.data.kpis.totalIncome} />
              <Kpi label="Gross Profit" value={statementQuery.data.kpis.grossProfit} />
              <Kpi label="Total Expenses" value={statementQuery.data.kpis.totalExpenses} />
              <Kpi label="Net Income" value={statementQuery.data.kpis.netIncome} />
            </div>
            <PLTable data={statementQuery.data} />
          </>
        )
      )}
    </div>
  );
}
