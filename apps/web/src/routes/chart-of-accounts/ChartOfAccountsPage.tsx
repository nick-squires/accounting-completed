import { useMemo } from "react";
import { Card } from "@accounting-completed/ui";
import { useAccounts } from "@accounting-completed/api-client";
import { useClient } from "../../app/client-context";
import { PageHeader } from "../../components/PageHeader";
import { groupAccountsByType } from "./groupAccounts";

const money = (n: number | null) =>
  n == null ? "—" : n.toLocaleString(undefined, { style: "currency", currency: "USD" });

export function ChartOfAccountsPage() {
  const { clientId } = useClient();
  const numericClientId = clientId ? Number(clientId) : null;
  const accountsQuery = useAccounts({ clientId: numericClientId });
  const groups = useMemo(() => groupAccountsByType(accountsQuery.data ?? []), [accountsQuery.data]);

  return (
    <div>
      <PageHeader title="Chart of accounts" />

      {accountsQuery.isLoading && <div className="text-text-soft">Loading…</div>}
      {accountsQuery.isError && (
        <div className="text-destructive">
          Failed to load. <button type="button" className="underline" onClick={() => accountsQuery.refetch()}>Retry</button>
        </div>
      )}
      {accountsQuery.isSuccess && groups.length === 0 && (
        <div className="text-text-soft">No accounts for this client.</div>
      )}

      {accountsQuery.isSuccess && groups.length > 0 && (
        <div className="space-y-6">
          {groups.map((g) => (
            <Card key={g.type} className="overflow-hidden">
              <table className="w-full text-[13.5px]">
                <thead className="bg-muted/60 border-b border-border">
                  <tr>
                    <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium">
                      {g.type}
                    </th>
                    <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[180px]">Category</th>
                    <th className="text-right px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[160px]">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {g.accounts.map((acc) => (
                    <tr key={acc.code} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="px-3 py-2 text-foreground">{acc.name}</td>
                      <td className="px-3 py-2 text-text-soft">{acc.category ?? "—"}</td>
                      <td className="px-3 py-2 text-right tnum">{money(acc.balance)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/40 border-t border-border font-medium">
                    <td className="px-3 py-2" colSpan={2}>Total {g.type}</td>
                    <td className="px-3 py-2 text-right tnum">{money(g.subtotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
