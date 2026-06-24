import { useState } from "react";
import { Button, Card, CardFooter } from "@accounting-completed/ui";
import { useMe, useClients } from "@accounting-completed/api-client";
import { cn } from "@accounting-completed/utils";
import { ICONS } from "../../layout/icons";
import { PageHeader } from "../../components/PageHeader";
import { useClient } from "../../app/client-context";

type TxnTab = "review" | "categorized" | "excluded" | "all";

export function TransactionsPage() {
  const [tab, setTab] = useState<TxnTab>("review");
  const [q, setQ] = useState("");

  const { data: me } = useMe();
  const isStaff = me?.roles?.isStaff ?? false;
  const { data: clients } = useClients({ enabled: isStaff });
  const { clientId } = useClient();
  const clientName = isStaff
    ? clients?.find((c) => c.id === clientId)?.name
    : me?.companyName?.trim() || undefined;

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
      <div className="flex items-center gap-1 mb-4 border-b border-border">
        {tabs.map(opt => (
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
        <Button size="sm" variant="outline">{ICONS.cal}<span>This month</span></Button>
        <Button size="sm" variant="outline">{ICONS.filter}<span>More filters</span></Button>
      </div>

      {/* Split layout: table + detail */}
      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 420px" }}>
        <Card className="overflow-hidden">
          <table className="w-full text-[13.5px]">
            <thead className="bg-muted/60 border-b border-border">
              <tr>
                <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[80px]">Date</th>
                <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium">Description</th>
                <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[260px]">Suggested category</th>
                <th className="text-right px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[140px]">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="px-3 py-16 text-center">
                  <div className="text-foreground font-medium text-[14px]">No transactions yet</div>
                  <div className="text-[13px] text-muted-foreground mt-1">
                    Imported and categorized transactions will appear here.
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <CardFooter>
            <div className="flex items-center justify-between w-full text-[12.5px] text-muted-foreground">
              <span>
                Showing <span className="font-mono text-foreground">0</span> transactions
              </span>
            </div>
          </CardFooter>
        </Card>

        <div className="min-w-0">
          <div className="bg-card border border-border rounded-lg p-10 text-center text-muted-foreground">
            <div className="text-foreground font-medium mb-1">Nothing selected</div>
            <div className="text-[13px]">
              Transactions you select will appear here to inspect, edit, or approve.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
