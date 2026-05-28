/* global React, ReactDOM, PageShell, PageHeader, StatTile, Button, Badge, Card, CardHeader, CardTitle, CardFooter,
            Avatar, cn, I */

const { useState } = React;

const INSTITUTIONS = [
  {
    id: "chase", name: "Chase Business",
    color: "from-[#1A56DB] to-[#1E3A8A]", initials: "JP",
    status: "ok",   lastSync: "12m ago", pending: 4,
    accounts: [
      { id: "a1", name: "Business Checking",      mask: "5847", type: "Checking", balance: 248_124.18, pending: 4, txns: 18 },
      { id: "a2", name: "Business Savings",       mask: "2103", type: "Savings",  balance:  82_410.00, pending: 0, txns: 2  },
      { id: "a3", name: "Business Credit Card",   mask: "9921", type: "Credit",   balance: -12_488.12, pending: 0, txns: 9  },
    ],
  },
  {
    id: "amex", name: "American Express",
    color: "from-[#0F2A57] to-[#062048]", initials: "AX",
    status: "ok",   lastSync: "18m ago", pending: 2,
    accounts: [
      { id: "b1", name: "Platinum Business",     mask: "1124", type: "Credit",   balance:  -4_218.42, pending: 2, txns: 14 },
    ],
  },
  {
    id: "wf", name: "Wells Fargo",
    color: "from-[#B41E20] to-[#7D1416]", initials: "WF",
    status: "reauth", lastSync: "3d ago",  pending: 0,
    accounts: [
      { id: "c1", name: "Operating Checking",    mask: "0492", type: "Checking", balance:  18_240.10, pending: 0, txns: 0 },
    ],
  },
  {
    id: "stripe", name: "Stripe",
    color: "from-[#6772E5] to-[#3A41B0]", initials: "S",
    status: "syncing", lastSync: "Syncing…", pending: 1,
    accounts: [
      { id: "d1", name: "Stripe Payments",       mask: "—",    type: "Processor",balance:   3_284.10, pending: 1, txns: 6 },
    ],
  },
  {
    id: "sq", name: "Square",
    color: "from-[#1E1E1E] to-[#1E1E1E]", initials: "SQ",
    status: "ok",   lastSync: "8m ago", pending: 0,
    accounts: [
      { id: "e1", name: "Square Settlements",    mask: "—",    type: "Processor",balance:  12_048.80, pending: 0, txns: 12 },
    ],
  },
];

const STATUS_MAP = {
  ok:      { label: "Connected",         variant: "positive", dot: true,  icon: I.check  },
  syncing: { label: "Importing",         variant: "info",     dot: true,  icon: I.refresh },
  reauth:  { label: "Reconnect required", variant: "warning",  dot: true,  icon: I.alert  },
  error:   { label: "Connection error",  variant: "destructive", dot: true, icon: I.alert  },
};

const fmtBal = (n) => {
  const abs = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (n < 0 ? "−$" : "$") + abs;
};

/* ---------- Institution card ---------- */
function InstitutionCard({ inst, onAdd }) {
  const s = STATUS_MAP[inst.status];
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4 min-w-0">
          <div className={cn("w-12 h-12 rounded-lg grid place-items-center text-white font-semibold flex-shrink-0 bg-gradient-to-br", inst.color)}>
            <span className="text-[15px] font-mono">{inst.initials}</span>
          </div>
          <div className="min-w-0">
            <CardTitle>{inst.name}</CardTitle>
            <div className="text-[12px] text-muted-foreground mt-0.5">
              {inst.accounts.length} {inst.accounts.length === 1 ? "account" : "accounts"} · last sync <span className="font-mono text-foreground">{inst.lastSync}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={s.variant} dot={s.dot}>{s.label}</Badge>
          {inst.status === "reauth" && (
            <Button size="sm" variant="primary">{I.link}<span>Reconnect</span></Button>
          )}
          {inst.status === "ok" && (
            <Button size="sm" variant="ghost">{I.refresh}<span>Refresh</span></Button>
          )}
          {inst.status === "syncing" && (
            <Button size="sm" variant="ghost" disabled>
              <span className="animate-spin">{I.refresh}</span><span>Importing…</span>
            </Button>
          )}
          <Button size="icon" variant="ghost">{I.more}</Button>
        </div>
      </CardHeader>

      <table className="w-full text-[13.5px]">
        <thead className="bg-muted/60 border-b border-border/60">
          <tr>
            <th className="text-left px-5 h-8 text-[10.5px] uppercase tracking-wider text-text-soft font-medium">Account</th>
            <th className="text-left px-3 h-8 text-[10.5px] uppercase tracking-wider text-text-soft font-medium w-[110px]">Type</th>
            <th className="text-right px-3 h-8 text-[10.5px] uppercase tracking-wider text-text-soft font-medium w-[160px]">Current balance</th>
            <th className="text-right px-3 h-8 text-[10.5px] uppercase tracking-wider text-text-soft font-medium w-[120px]">New / pending</th>
            <th className="w-[60px] px-3"></th>
          </tr>
        </thead>
        <tbody>
          {inst.accounts.map(a => (
            <tr key={a.id} className="border-b border-border/60 last:border-b-0 hover:bg-muted/60 transition-colors group">
              <td className="px-5 align-middle" style={{ height: 52 }}>
                <div className="font-medium">{a.name}</div>
                <div className="font-mono text-[11px] text-text-soft">···· {a.mask}</div>
              </td>
              <td className="px-3 text-muted-foreground">{a.type}</td>
              <td className={cn("px-3 text-right font-mono tnum font-medium", a.balance < 0 ? "text-destructive" : "text-foreground")}>
                {fmtBal(a.balance)}
              </td>
              <td className="px-3 text-right">
                {a.pending > 0 ? (
                  <Badge variant="warning" dot>{a.pending} pending</Badge>
                ) : a.txns > 0 ? (
                  <span className="font-mono tnum text-[12.5px] text-muted-foreground">{a.txns} this week</span>
                ) : (
                  <span className="text-text-soft text-[12.5px]">—</span>
                )}
              </td>
              <td className="px-3 text-right">
                <Button size="icon-sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">{I.chevRight}</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {inst.status === "reauth" && (
        <div className="bg-warning-soft/50 border-t border-warning/20 px-5 py-3 flex items-center gap-3 text-[13px] text-warning">
          <span className="w-4 h-4">{I.alert}</span>
          <span className="flex-1">
            Wells Fargo requires you to re-authorize Accounting Completed. Bank feeds have been paused since <span className="font-mono font-medium">2026-05-25</span>.
          </span>
          <Button size="sm" variant="primary">Reconnect</Button>
        </div>
      )}
    </Card>
  );
}

/* ---------- Add account row ---------- */
function AddAccountCard({ onAdd }) {
  return (
    <div
      onClick={onAdd}
      className="w-full text-left bg-card border border-dashed border-border-strong rounded-lg p-6 hover:border-primary hover:bg-accent/40 transition-colors group cursor-pointer">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg grid place-items-center bg-secondary text-text-soft group-hover:bg-accent group-hover:text-primary transition-colors flex-shrink-0">
          <span className="w-5 h-5">{I.plus}</span>
        </div>
        <div className="flex-1">
          <div className="font-semibold text-foreground">Connect a new account</div>
          <div className="text-[13px] text-muted-foreground mt-0.5">
            Choose from <span className="font-medium text-foreground">14,000+</span> banks &amp; credit unions via Finicity, or upload statements manually.
          </div>
        </div>
        <Button variant="primary">{I.plus}<span>Add account</span></Button>
      </div>
    </div>
  );
}

/* ---------- App ---------- */
function App() {
  const totals = INSTITUTIONS.reduce((acc, inst) => {
    acc.accounts += inst.accounts.length;
    acc.pending  += inst.pending;
    return acc;
  }, { accounts: 0, pending: 0 });
  const issues = INSTITUTIONS.filter(i => i.status === "reauth" || i.status === "error").length;
  const liquid = INSTITUTIONS.flatMap(i => i.accounts)
                              .filter(a => a.type === "Checking" || a.type === "Savings")
                              .reduce((s, a) => s + a.balance, 0);

  return (
    <PageShell activeKey="bank" crumbs={["Bank feeds"]}>
      <PageHeader
        title="Bank feeds"
        sub={<>Atlas Coffee Roasters · <span className="font-mono text-foreground">{totals.accounts}</span> connected accounts · last full sync <span className="font-mono text-foreground">12 minutes ago</span></>}
        actions={
          <>
            <Button>{I.refresh}<span>Sync all</span></Button>
            <Button>{I.download}<span>Import statement (CSV)</span></Button>
            <Button variant="primary">{I.plus}<span>Connect account</span></Button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatTile label="Connected accounts" value={totals.accounts} sub={`${INSTITUTIONS.length} institutions`} />
        <StatTile label="Pending to import" value={totals.pending} sub="awaiting auto-sync" intent="accent" />
        <StatTile label="Connection issues" value={issues} sub={issues > 0 ? "needs your attention" : "all good"} intent={issues > 0 ? "warning" : "positive"} />
        <StatTile label="Cash on hand · liquid" value={fmtBal(liquid)} sub="checking + savings" intent="positive" />
      </div>

      <div className="flex flex-col gap-4">
        {INSTITUTIONS.map(inst => <InstitutionCard key={inst.id} inst={inst} />)}
        <AddAccountCard />
      </div>

      {/* Help / disclaimer */}
      <div className="mt-8 text-center text-[12px] text-text-soft">
        Bank feeds are powered by Finicity, a Mastercard company. Accounting Completed uses read-only OAuth — we never see or store your bank credentials.{" "}
        <a className="text-primary hover:underline" href="#">Learn how connections work →</a>
      </div>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
