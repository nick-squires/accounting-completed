/* global React, ReactDOM, PageShell, PageHeader, StatTile, Button, Input, Kbd, Badge,
            Card, CardHeader, CardTitle, CardFooter, Tabs, TabsTrigger, AvatarRound, cn, I */

const { useState, useMemo } = React;

/* ---------- Journal entries ---------- */
const ENTRIES = [
  {
    id: "JE-2026-0042",
    date: "May 24, 2026", iso: "2026-05-24",
    memo: "Depreciation — May 2026",
    status: "approved", approver: "Jordan R.", createdBy: "Jordan R.",
    expanded: true,
    lines: [
      { account: "5900 Depreciation expense",      memo: "Roasting equipment · monthly", debit: 1480.00, credit: null },
      { account: "5900 Depreciation expense",      memo: "Café build-out · monthly",      debit:  775.00, credit: null },
      { account: "5900 Depreciation expense",      memo: "Vehicles · monthly",            debit:  135.00, credit: null },
      { account: "1590 Accumulated depreciation",  memo: "Contra-asset",                  debit: null,    credit: 2390.00 },
    ],
  },
  {
    id: "JE-2026-0041",
    date: "May 22, 2026", iso: "2026-05-22",
    memo: "Reclassify Square refunds → 4020 contra",
    status: "approved", approver: "Priya S.", createdBy: "Jordan R.",
    lines: [
      { account: "4020 Retail café sales",     debit: 480.00, credit: null },
      { account: "4025 Sales refunds",         debit: null,    credit: 480.00 },
    ],
  },
  {
    id: "JE-2026-0040",
    date: "May 18, 2026", iso: "2026-05-18",
    memo: "Accrue April utilities (PG&E + water)",
    status: "approved", approver: "Priya S.", createdBy: "Marcus T.",
    lines: [
      { account: "6040 Utilities",             debit: 842.18, credit: null },
      { account: "6040 Utilities",             debit: 218.40, credit: null },
      { account: "2150 Accrued expenses",      debit: null,    credit: 1060.58 },
    ],
  },
  {
    id: "JE-2026-0039",
    date: "May 15, 2026", iso: "2026-05-15",
    memo: "Reverse prior month accrual",
    status: "draft", approver: null, createdBy: "Marcus T.",
    lines: [
      { account: "2150 Accrued expenses",      debit: 1060.58, credit: null },
      { account: "6040 Utilities",             debit: null,    credit: 1060.58 },
    ],
  },
  {
    id: "JE-2026-0038",
    date: "May 10, 2026", iso: "2026-05-10",
    memo: "Owner contribution — Q2 funding",
    status: "approved", approver: "Jordan R.", createdBy: "Jordan R.",
    lines: [
      { account: "1010 Operating checking",    debit: 25000.00, credit: null },
      { account: "3010 Owner's equity",        debit: null,      credit: 25000.00 },
    ],
  },
  {
    id: "JE-2026-0037",
    date: "May 03, 2026", iso: "2026-05-03",
    memo: "Inventory adjustment — physical count",
    status: "approved", approver: "Jordan R.", createdBy: "Priya S.",
    lines: [
      { account: "5050 Inventory shrinkage",   debit: 184.20, credit: null },
      { account: "1300 Inventory — green",     debit: null,    credit: 184.20 },
    ],
  },
];

const STATUS = {
  draft:    { variant: "warning", label: "Draft",    dot: true },
  approved: { variant: "positive",label: "Approved", dot: true },
  voided:   { variant: "default", label: "Voided" },
};

const fmtN = (n) => n == null ? "" : n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const total = (entry, side) =>
  entry.lines.reduce((s, l) => s + (l[side] || 0), 0);

/* ---------- Entry card ---------- */
function EntryCard({ e, expanded, onToggle }) {
  const debits  = total(e, "debit");
  const credits = total(e, "credit");
  const balanced = Math.abs(debits - credits) < 0.005;
  const s = STATUS[e.status];

  return (
    <Card className={cn("transition-colors", expanded && "ring-2 ring-accent border-primary/30")}>
      {/* Header row */}
      <button onClick={onToggle} className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/40 transition-colors">
        <span className={cn("w-6 flex-shrink-0 text-text-soft transition-transform", expanded && "rotate-90 text-primary")}>{I.chevRight}</span>
        <div className="grid items-center gap-4 flex-1 min-w-0" style={{ gridTemplateColumns: "150px 1fr auto auto" }}>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[12px] text-primary font-medium">{e.id}</span>
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate">{e.memo}</div>
            <div className="text-[12px] text-text-soft mt-0.5">
              <span className="font-mono">{e.iso}</span>
              <span className="mx-1.5">·</span>
              <span>{e.lines.length} lines</span>
              <span className="mx-1.5">·</span>
              <span>by <span className="text-foreground/80">{e.createdBy}</span></span>
              {e.approver && (
                <>
                  <span className="mx-1.5">·</span>
                  <span>approved by <span className="text-foreground/80">{e.approver}</span></span>
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono tnum text-[14px] font-medium">${fmtN(debits)}</div>
            <div className="text-[11px] text-text-soft">total debits</div>
          </div>
          <Badge variant={s.variant} dot={s.dot}>{s.label}</Badge>
        </div>
      </button>

      {/* Expanded lines */}
      {expanded && (
        <>
          <table className="w-full text-[13.5px] border-t border-border/60">
            <thead className="bg-muted/40 border-b border-border/60">
              <tr>
                <th className="text-left px-5 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[16px]"></th>
                <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium">Account</th>
                <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium">Memo</th>
                <th className="text-right px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[140px]">Debit</th>
                <th className="text-right px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[140px]">Credit</th>
              </tr>
            </thead>
            <tbody>
              {e.lines.map((l, i) => (
                <tr key={i} className="border-b border-border/60 last:border-b-0 hover:bg-muted/40 transition-colors">
                  <td className="px-5 align-middle">
                    <span className="font-mono text-text-soft text-[11px]">{i + 1}</span>
                  </td>
                  <td className="px-3 align-middle font-medium" style={{ height: 40 }}>
                    <span className="font-mono text-text-soft text-[11px] mr-2">{l.account.split(" ")[0]}</span>
                    {l.account.split(" ").slice(1).join(" ")}
                  </td>
                  <td className="px-3 align-middle text-muted-foreground text-[12.5px]">{l.memo || <span className="text-text-soft">—</span>}</td>
                  <td className="px-3 align-middle text-right font-mono tnum text-positive">{l.debit ? fmtN(l.debit) : <span className="text-text-soft">—</span>}</td>
                  <td className="px-3 align-middle text-right font-mono tnum text-destructive">{l.credit ? fmtN(l.credit) : <span className="text-text-soft">—</span>}</td>
                </tr>
              ))}
              <tr className="bg-secondary/60 border-t-2 border-border-strong">
                <td colSpan={3} className="px-5 h-10 font-semibold text-right pr-3">Totals</td>
                <td className="px-3 text-right font-mono tnum font-semibold text-positive">{fmtN(debits)}</td>
                <td className="px-3 text-right font-mono tnum font-semibold text-destructive">{fmtN(credits)}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex items-center justify-between px-5 py-3 border-t border-border/60 bg-muted">
            <div className="flex items-center gap-2 text-[13px]">
              {balanced ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-positive"></span>
                  <span className="text-positive font-medium">Balanced</span>
                  <span className="text-text-soft">— debits and credits agree</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-destructive"></span>
                  <span className="text-destructive font-medium">Out of balance · {fmtN(Math.abs(debits - credits))}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost">{I.print}<span>Print</span></Button>
              <Button size="sm" variant="ghost">Duplicate</Button>
              {e.status === "draft" ? (
                <>
                  <Button size="sm" variant="ghost">Discard</Button>
                  <Button size="sm" variant="primary">Submit for approval</Button>
                </>
              ) : (
                <Button size="sm">Edit</Button>
              )}
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

/* ---------- App ---------- */
function App() {
  const [tab, setTab] = useState("all");
  const [openId, setOpenId] = useState("JE-2026-0042");

  const stats = useMemo(() => ({
    total:    ENTRIES.length,
    drafts:   ENTRIES.filter(e => e.status === "draft").length,
    approved: ENTRIES.filter(e => e.status === "approved").length,
    netAdj:   ENTRIES.reduce((s, e) => s + total(e, "debit"), 0),
  }), []);

  const visible = useMemo(() => {
    if (tab === "all") return ENTRIES;
    return ENTRIES.filter(e => e.status === tab);
  }, [tab]);

  return (
    <PageShell activeKey="journal" crumbs={["Reports", "General Journal"]}>
      <PageHeader
        title="General Journal"
        sub={<>Atlas Coffee Roasters · <span className="font-mono text-foreground font-medium">{stats.total} entries</span> this month · <span className="text-warning">{stats.drafts} draft</span></>}
        actions={
          <>
            <Button>{I.download}<span>Export</span></Button>
            <Button>{I.print}<span>Print register</span></Button>
            <Button variant="primary">{I.plus}<span>New journal entry</span></Button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatTile label="Entries this month" value={stats.total} sub="across all accounts" />
        <StatTile label="Awaiting approval"  value={stats.drafts} sub="drafts to review" intent={stats.drafts ? "warning" : "positive"} />
        <StatTile label="Approved YTD"       value={156} sub="locked in books" intent="positive" />
        <StatTile label="Net adjustments"    value={"$" + Math.round(stats.netAdj).toLocaleString()} sub="total debits, all entries" intent="accent" />
      </div>

      {/* Tabs + filters */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsTrigger value="all">All <span className="ml-1 font-mono tnum opacity-60">{stats.total}</span></TabsTrigger>
          <TabsTrigger value="draft">Drafts <span className="ml-1 font-mono tnum opacity-60">{stats.drafts}</span></TabsTrigger>
          <TabsTrigger value="approved">Approved <span className="ml-1 font-mono tnum opacity-60">{stats.approved}</span></TabsTrigger>
          <TabsTrigger value="voided">Voided <span className="ml-1 font-mono tnum opacity-60">0</span></TabsTrigger>
        </Tabs>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">{I.cal}<span>This month</span></Button>
          <Button size="sm" variant="outline">All authors</Button>
          <Button size="sm" variant="outline">{I.filter}<span>Filters</span></Button>
        </div>
      </div>

      {/* Entries list */}
      <div className="flex flex-col gap-3">
        {visible.length === 0 ? (
          <Card>
            <div className="p-10 text-center text-muted-foreground">
              <div className="text-foreground font-medium mb-1">No entries in this view</div>
              <div className="text-[13px]">Try a different tab, or <button onClick={() => setTab("all")} className="text-primary hover:underline">show all</button>.</div>
            </div>
          </Card>
        ) : visible.map(e => (
          <EntryCard
            key={e.id}
            e={e}
            expanded={e.id === openId}
            onToggle={() => setOpenId(openId === e.id ? null : e.id)}
          />
        ))}
      </div>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
