/* global React, ReactDOM, PageShell, PageHeader, Button, Input, Badge, Card, CardHeader, CardTitle,
            CardFooter, AvatarRound, cn, I */

const { useState } = React;

const SETTINGS_NAV = [
  { group: "Firm",   items: [
    { key: "company",  label: "Company info" },
    { key: "fiscal",   label: "Fiscal year" },
    { key: "closing",  label: "Closing period", badge: "1 due" },
    { key: "tax",      label: "Tax setup" },
  ]},
  { group: "Connections", items: [
    { key: "integrations", label: "Integrations", badge: "5" },
    { key: "feeds",        label: "Bank feeds" },
    { key: "import",       label: "Import / export" },
  ]},
  { group: "Workflow", items: [
    { key: "notifications", label: "Notifications" },
    { key: "approvals",     label: "Approval rules" },
    { key: "automation",    label: "Automation" },
  ]},
  { group: "Account", items: [
    { key: "billing",  label: "Billing" },
    { key: "security", label: "Security & sessions" },
    { key: "api",      label: "API & webhooks" },
  ]},
];

const CLOSING_HISTORY = [
  { period: "Apr 2026", closedAt: "2026-05-08", closedBy: "Scott Turner", entries: 217, locked: true },
  { period: "Mar 2026", closedAt: "2026-04-09", closedBy: "Priya Sharma", entries: 184, locked: true },
  { period: "Feb 2026", closedAt: "2026-03-12", closedBy: "Scott Turner", entries: 195, locked: true },
  { period: "Jan 2026", closedAt: "2026-02-14", closedBy: "Adelina Costa", entries: 168, locked: true },
  { period: "Dec 2025 Â· year-end", closedAt: "2026-01-22", closedBy: "Adelina Costa", entries: 412, locked: true, yearEnd: true },
];

const CHECKLIST = [
  { label: "All bank statements reconciled through May 31",    done: true,  count: "3 / 3 accounts" },
  { label: "All transactions categorized",                     done: false, count: "42 still in review" },
  { label: "Accounts receivable reviewed",                     done: true,  count: "$48,220 outstanding" },
  { label: "Accounts payable reviewed",                        done: true,  count: "$38,420 outstanding" },
  { label: "Depreciation journal entry posted",                done: true,  count: "JE-2026-0042" },
  { label: "Inventory adjustment posted",                      done: true,  count: "JE-2026-0037" },
  { label: "Trial balance balances",                           done: true,  count: "Debits = Credits" },
  { label: "Tax provision recorded",                           done: false, count: "draft only" },
];

/* ---------- Settings rail ---------- */
function SettingsRail({ active, onChange }) {
  return (
    <aside className="w-[240px] flex-shrink-0 border-r border-border bg-card overflow-y-auto">
      <div className="p-4 border-b border-border/60">
        <div className="text-[11px] uppercase tracking-wider text-text-soft font-medium">Settings</div>
        <div className="font-semibold text-[15px] mt-1">Records in Order</div>
      </div>
      <nav className="py-2">
        {SETTINGS_NAV.map((g, gi) => (
          <div key={gi} className="mb-3">
            <div className="px-4 pt-2 pb-1 text-[10.5px] uppercase tracking-wider text-text-soft font-medium">{g.group}</div>
            {g.items.map(it => (
              <button key={it.key} onClick={() => onChange(it.key)}
                      className={cn(
                        "w-full flex items-center justify-between gap-2 px-4 py-1.5 text-left transition-colors text-[13.5px]",
                        active === it.key ? "bg-accent text-primary font-medium" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}>
                <span>{it.label}</span>
                {it.badge && (
                  <span className={cn("text-[10.5px] font-mono tnum px-1.5 py-0.5 rounded",
                                       active === it.key ? "bg-primary text-primary-foreground" : "bg-secondary text-text-soft")}>
                    {it.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

/* ---------- Closing period section ---------- */
function ClosingPeriodSection() {
  const done = CHECKLIST.filter(c => c.done).length;
  const progress = (done / CHECKLIST.length) * 100;
  const canClose = done === CHECKLIST.length;

  return (
    <div className="max-w-[920px]">
      <div className="mb-2 text-[11px] uppercase tracking-wider text-text-soft font-medium">Firm Â· Atlas Coffee Roasters</div>
      <h2 className="text-[24px] leading-7 font-semibold tracking-tight mb-1">Closing period</h2>
      <p className="text-[14px] text-muted-foreground mb-8 max-w-[60ch]" style={{ textWrap: "pretty" }}>
        Lock a period after it's been reviewed. Closed periods can't be edited without admin approval, protecting reported numbers from drift.
      </p>

      {/* Status hero */}
      <Card className="mb-6 overflow-hidden">
        <div className="bg-gradient-to-br from-primary to-[hsl(202_85%_18%)] text-primary-foreground p-6 flex items-center justify-between gap-6">
          <div>
            <div className="text-[11px] uppercase tracking-wider opacity-70 mb-1">Books closed through</div>
            <div className="font-mono text-[36px] leading-none font-semibold tracking-tight">April 30, 2026</div>
            <div className="text-[13px] opacity-80 mt-2">Closed by <span className="font-medium">Scott Turner</span> Â· May 8, 2026</div>
          </div>
          <div className="text-right">
            <Button variant="secondary" className="bg-white/15 text-white border-white/20 hover:bg-white/25">
              {I.refresh}<span>Reopen April</span>
            </Button>
            <div className="text-[11px] opacity-70 mt-2">Admin approval required</div>
          </div>
        </div>

        {/* Close-next pre-flight */}
        <div className="p-6 border-t border-primary/20">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[16px] font-semibold">Close May 2026</h3>
                <Badge variant="warning" dot>2 items left</Badge>
              </div>
              <p className="text-[13px] text-muted-foreground">
                Complete the checklist below to lock May. May 31 is the proposed close date.
              </p>
            </div>
            <Button variant="primary" disabled={!canClose}>
              {I.check}<span>Close May 2026</span>
            </Button>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="font-mono tnum text-[13px] text-muted-foreground">
              <span className="text-foreground font-medium">{done}</span> / {CHECKLIST.length}
            </span>
          </div>

          <div className="border border-border rounded-md divide-y divide-border/60 overflow-hidden">
            {CHECKLIST.map((c, i) => (
              <div key={i} className={cn(
                "flex items-center gap-3 px-4 py-2.5",
                c.done ? "bg-card" : "bg-warning-soft/30"
              )}>
                <span className={cn(
                  "w-4 h-4 rounded-full grid place-items-center flex-shrink-0",
                  c.done ? "bg-positive text-white" : "border-2 border-warning bg-card"
                )}>
                  {c.done && <span className="w-2.5 h-2.5">{I.check}</span>}
                </span>
                <span className={cn("flex-1 text-[13.5px]", c.done ? "text-muted-foreground line-through" : "text-foreground font-medium")}>
                  {c.label}
                </span>
                <span className={cn("text-[12px] font-mono tnum", c.done ? "text-text-soft" : "text-warning")}>
                  {c.count}
                </span>
                {!c.done && (
                  <Button size="sm" variant="ghost" className="text-primary">Review â†’</Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Policy controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Reopen policy</CardTitle>
        </CardHeader>
        <div className="p-5 space-y-5">
          <SettingRow label="Allow reopening closed periods"
                      sub="Without this, even admins can't edit closed books â€” period."
                      control={<Toggle value={true} />} />
          <SettingRow label="Require admin password"
                      sub="A firm admin must enter their password to confirm reopening."
                      control={<Toggle value={true} />} />
          <SettingRow label="Notify partners on reopen"
                      sub="Email Adelina Costa whenever any period is reopened."
                      control={<Toggle value={false} />} />
          <SettingRow label="Auto-close after period end"
                      sub="Lock books automatically 30 days after each month ends, if checklist is complete."
                      control={<Toggle value={false} />} />
        </div>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent closings</CardTitle>
          <a href="#" className="text-[12px] text-primary hover:underline">Audit log â†’</a>
        </CardHeader>
        <table className="w-full text-[13.5px]">
          <thead className="bg-muted/60 border-b border-border/60">
            <tr>
              <th className="text-left px-5 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[200px]">Period</th>
              <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[140px]">Closed on</th>
              <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium">Closed by</th>
              <th className="text-right px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[120px]">Entries</th>
              <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[120px]">Status</th>
              <th className="w-[120px]"></th>
            </tr>
          </thead>
          <tbody>
            {CLOSING_HISTORY.map((h, i) => (
              <tr key={i} className="border-b border-border/60 last:border-b-0 hover:bg-muted/60 transition-colors group">
                <td className="px-5 align-middle font-medium" style={{ height: 48 }}>
                  {h.period}
                  {h.yearEnd && <Badge variant="accent" className="ml-2 h-5 text-[10px] px-2">Year-end</Badge>}
                </td>
                <td className="px-3 align-middle font-mono text-[12.5px] text-muted-foreground">{h.closedAt}</td>
                <td className="px-3 align-middle">
                  <div className="flex items-center gap-2">
                    <AvatarRound size={22}>{h.closedBy.split(" ").map(s => s[0]).join("")}</AvatarRound>
                    <span className="text-[13px]">{h.closedBy}</span>
                  </div>
                </td>
                <td className="px-3 align-middle text-right font-mono tnum">{h.entries}</td>
                <td className="px-3 align-middle">
                  <Badge variant="positive" dot>Locked</Badge>
                </td>
                <td className="px-3 align-middle">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="ghost">{I.refresh}<span>Reopen</span></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ---------- Generic setting row + toggle ---------- */
function SettingRow({ label, sub, control }) {
  return (
    <div className="flex items-start justify-between gap-6 py-3 border-b border-border/60 last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[14px]">{label}</div>
        {sub && <div className="text-[12.5px] text-muted-foreground mt-0.5" style={{ textWrap: "pretty" }}>{sub}</div>}
      </div>
      <div className="flex-shrink-0 pt-1">{control}</div>
    </div>
  );
}
function Toggle({ value: initialValue = false }) {
  const [v, setV] = useState(initialValue);
  return (
    <button onClick={() => setV(!v)}
            className={cn("relative w-9 h-5 rounded-full transition-colors",
                            v ? "bg-primary" : "bg-secondary")}>
      <span className={cn("absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-elev-xs transition-transform",
                            v && "translate-x-4")} />
    </button>
  );
}

/* ---------- App ---------- */
function App() {
  const [active, setActive] = useState("closing");

  return (
    <PageShell activeKey="settings" crumbs={["Settings"]} mainClassName="p-0">
      <div className="grid h-full" style={{ gridTemplateColumns: "240px 1fr" }}>
        <SettingsRail active={active} onChange={setActive} />
        <section className="overflow-auto p-8">
          {active === "closing" && <ClosingPeriodSection />}
          {active !== "closing" && (
            <div className="max-w-[920px]">
              <div className="mb-2 text-[11px] uppercase tracking-wider text-text-soft font-medium">Firm Â· Records in Order</div>
              <h2 className="text-[24px] leading-7 font-semibold tracking-tight mb-1 capitalize">{active}</h2>
              <p className="text-[14px] text-muted-foreground mb-8">This section is part of the design system but not detailed in this mock-up. The closing period view is the canonical example.</p>
              <Card className="p-10 text-center text-muted-foreground">
                <button onClick={() => setActive("closing")} className="text-primary hover:underline">â† Back to Closing period</button>
              </Card>
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
