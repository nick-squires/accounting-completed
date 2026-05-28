/* global React, ReactDOM, PageShell, PageHeader, StatTile, Button, Badge, Card, CardHeader, CardTitle,
            CardFooter, Tabs, TabsTrigger, AvatarRound, Sparkline, cn, I */

const { useState, useMemo } = React;

/* ---------- Rule data ---------- */
const RULES = [
  { id: "r1",  name: "Square Settlement",     pattern: "description starts with â€œSQUAREâ€",            account: "4020 Retail cafÃ© sales",          hits: 142, accuracy: 100, lastHit: "2h ago",   status: "active", owner: "auto-learned" },
  { id: "r2",  name: "Blue Bottle invoices",  pattern: "description contains â€œBLUE BOTTLEâ€",          account: "4010 Wholesale roasted coffee",   hits:  18, accuracy: 100, lastHit: "Yesterday",status: "active", owner: "Scott T." },
  { id: "r3",  name: "Stripe payouts",        pattern: "description equals â€œSTRIPE TRANSFERâ€",        account: "4030 Subscription box revenue",   hits:  62, accuracy:  98, lastHit: "1h ago",   status: "active", owner: "Scott T." },
  { id: "r4",  name: "Gusto payroll",         pattern: "description starts with â€œGUSTO PAYROLLâ€",     account: "6010 Salaries & wages",           hits:  10, accuracy: 100, lastHit: "Yesterday",status: "active", owner: "Priya S." },
  { id: "r5",  name: "CafÃ© imports â€” green",  pattern: "vendor is â€œCafe Imports LLCâ€",                account: "5010 Green coffee purchases",     hits:  24, accuracy: 100, lastHit: "2d ago",   status: "active", owner: "Scott T." },
  { id: "r6",  name: "PG&E utilities",        pattern: "description contains â€œPG&Eâ€",                 account: "6040 Utilities",                  hits:   5, accuracy: 100, lastHit: "5d ago",   status: "active", owner: "auto-learned" },
  { id: "r7",  name: "Roastery lease",        pattern: "description equals â€œROASTERY LEASE LLCâ€",      account: "6030 Rent & occupancy",           hits:   5, accuracy: 100, lastHit: "6d ago",   status: "active", owner: "Priya S." },
  { id: "r8",  name: "State Farm insurance",  pattern: "description contains â€œSTATE FARMâ€",           account: "6070 Insurance",                  hits:   5, accuracy: 100, lastHit: "1w ago",   status: "active", owner: "auto-learned" },
  { id: "r9",  name: "Mailchimp",             pattern: "description equals â€œMAILCHIMP MONTHLYâ€",       account: "6060 Software & subscriptions",   hits:   5, accuracy: 100, lastHit: "1w ago",   status: "active", owner: "Scott T." },
  { id: "r10", name: "AT&T phone + net",      pattern: "description contains â€œAT&Tâ€",                 account: "6040 Utilities",                  hits:   5, accuracy: 100, lastHit: "2w ago",   status: "active", owner: "auto-learned" },
  { id: "r11", name: "Upwork freelancers",    pattern: "description contains â€œUPWORKâ€",               account: "6050 Marketing & advertising",    hits:   3, accuracy:  67, lastHit: "1w ago",   status: "review", owner: "Scott T.", note: "Conflicts with 2 manual recategorizations" },
  { id: "r12", name: "Amazon â€” uncategorized",pattern: "description contains â€œAMAZONâ€ AND amount < $500", account: "(suggest at review)",         hits:  18, accuracy: null,lastHit: "2d ago",   status: "suggest", owner: "auto-learned", note: "Asks before applying" },
  { id: "r13", name: "United / Delta travel", pattern: "merchant category = airlines",                account: "6080 Travel & entertainment",     hits:   6, accuracy:  83, lastHit: "1w ago",   status: "active", owner: "Marcus T." },
  { id: "r14", name: "Old: Heartland POS",    pattern: "description contains â€œHEARTLANDâ€",            account: "4020 Retail cafÃ© sales",          hits:   0, accuracy: null,lastHit: "â€”",        status: "inactive", owner: "Scott T." },
];

const STATUS = {
  active:   { label: "Active",      variant: "positive", dot: true },
  suggest:  { label: "Suggest only",variant: "info",     dot: true },
  review:   { label: "Needs review",variant: "warning",  dot: true },
  inactive: { label: "Inactive",    variant: "default" },
};

/* ---------- Suggested rules card ---------- */
const SUGGESTIONS = [
  { desc: 'description contains "PG&E"',          account: "6040 Utilities",                  matches: 5,  confidence: 100 },
  { desc: 'description contains "DOORDASH MERCHANT"', account: "4020 Retail cafÃ© sales",      matches: 8,  confidence: 92 },
  { desc: 'description equals "ADOBE *CC ALL APPS"', account: "6060 Software & subscriptions", matches: 5,  confidence: 100 },
];

/* ---------- App ---------- */
function App() {
  const [tab, setTab] = useState("rules");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q) return RULES;
    const n = q.toLowerCase();
    return RULES.filter(r => r.name.toLowerCase().includes(n) || r.pattern.toLowerCase().includes(n) || r.account.toLowerCase().includes(n));
  }, [q]);

  const stats = useMemo(() => ({
    total:    RULES.length,
    active:   RULES.filter(r => r.status === "active").length,
    hits:     RULES.reduce((s, r) => s + r.hits, 0),
    accuracy: Math.round(RULES.filter(r => r.accuracy != null).reduce((s, r) => s + r.accuracy, 0) / RULES.filter(r => r.accuracy != null).length),
  }), []);

  return (
    <PageShell activeKey="cats" crumbs={["Setup", "Categories & rules"]}>
      <PageHeader
        title="Categories & rules"
        sub={<>Atlas Coffee Roasters Â· <span className="font-mono text-foreground font-medium">{stats.active}</span> active rules categorized <span className="font-mono text-foreground">{stats.hits}</span> transactions this month</>}
        actions={
          <>
            <Button>{I.download}<span>Export rules</span></Button>
            <Button>{I.zap}<span>Suggest new rules</span></Button>
            <Button variant="primary">{I.plus}<span>New rule</span></Button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatTile label="Active rules" value={stats.active} sub={`${stats.total - stats.active} inactive`} intent="accent" />
        <StatTile label="Transactions auto-categorized" value={stats.hits} sub="this month" intent="positive" />
        <StatTile label="Average accuracy" value={`${stats.accuracy}%`} sub="based on manual overrides" intent="positive" />
        <StatTile label="Needs your attention" value={RULES.filter(r => r.status === "review").length}
                  sub="rules with conflicts" intent="warning" />
      </div>

      {/* Suggestions card */}
      <Card className="mb-6 ring-2 ring-accent border-primary/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-accent text-primary grid place-items-center flex-shrink-0">
              <span className="w-4 h-4">{I.zap}</span>
            </div>
            <div>
              <CardTitle>AC suggests {SUGGESTIONS.length} new rules</CardTitle>
              <div className="text-[12.5px] text-muted-foreground mt-0.5">Based on transactions you've categorized recently. One click to apply.</div>
            </div>
          </div>
          <Button variant="ghost" size="sm">Dismiss</Button>
        </CardHeader>
        <table className="w-full text-[13.5px] border-t border-border/60">
          <tbody>
            {SUGGESTIONS.map((s, i) => (
              <tr key={i} className="border-b border-border/60 last:border-b-0 hover:bg-muted/40 transition-colors">
                <td className="px-5 align-middle py-3 w-[40%]">
                  <span className="font-mono text-[12.5px] text-muted-foreground">When</span>{" "}
                  <span className="font-mono text-[12.5px] text-foreground">{s.desc}</span>
                </td>
                <td className="px-3 align-middle py-3 w-[30%]">
                  <span className="font-mono text-[12.5px] text-muted-foreground">categorize as</span>{" "}
                  <span className="font-medium">{s.account}</span>
                </td>
                <td className="px-3 align-middle py-3 text-text-soft text-[12px]">
                  {s.matches} recent matches Â· {s.confidence}% confidence
                </td>
                <td className="px-5 align-middle py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Button size="sm" variant="ghost">Edit</Button>
                    <Button size="sm" variant="primary">{I.check}<span>Apply</span></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Search */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsTrigger value="rules">Rules <span className="ml-1 font-mono tnum opacity-60">{RULES.length}</span></TabsTrigger>
          <TabsTrigger value="categories">Custom categories <span className="ml-1 font-mono tnum opacity-60">7</span></TabsTrigger>
          <TabsTrigger value="vendors">Vendor map <span className="ml-1 font-mono tnum opacity-60">42</span></TabsTrigger>
        </Tabs>
        <div className="relative w-[280px]">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-soft">{I.search}</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search rule name or patternâ€¦"
                 className="w-full h-8 pl-8 pr-3 rounded-md bg-card border border-border text-[13.5px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/30" />
        </div>
      </div>

      {/* Rules table */}
      <Card>
        <table className="w-full text-[13.5px]">
          <thead className="bg-muted/60 border-b border-border">
            <tr>
              <th className="text-left px-4 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[60px]">Order</th>
              <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium">Rule</th>
              <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[260px]">Maps to</th>
              <th className="text-right px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[100px]">Hits / mo</th>
              <th className="text-right px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[100px]">Accuracy</th>
              <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[110px]">Last fired</th>
              <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[140px]">Status</th>
              <th className="w-[60px]"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const s = STATUS[r.status];
              const isInactive = r.status === "inactive";
              return (
                <tr key={r.id}
                    className={cn("border-b border-border/60 hover:bg-muted/60 transition-colors group cursor-pointer",
                                    isInactive && "opacity-60")}
                    style={{ height: "var(--row-h, 56px)" }}>
                  <td className="px-4 align-middle">
                    <div className="flex items-center gap-2">
                      <span className="text-text-soft cursor-grab font-mono text-[14px]">â‹®â‹®</span>
                      <span className="font-mono text-text-soft text-[11.5px]">{(i + 1).toString().padStart(2, "0")}</span>
                    </div>
                  </td>
                  <td className="px-3 align-middle">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-[11.5px] text-text-soft font-mono mt-0.5 truncate">{r.pattern}</div>
                    {r.note && (
                      <div className="text-[11px] text-warning mt-1 flex items-center gap-1">
                        <span className="w-3 h-3">{I.alert}</span>
                        {r.note}
                      </div>
                    )}
                  </td>
                  <td className="px-3 align-middle">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-text-soft text-[11px]">{r.account.split(" ")[0]}</span>
                      <span className="text-[13px] truncate">{r.account.split(" ").slice(1).join(" ")}</span>
                    </div>
                  </td>
                  <td className="px-3 align-middle text-right font-mono tnum">{r.hits}</td>
                  <td className="px-3 align-middle text-right">
                    {r.accuracy == null ? <span className="text-text-soft text-[12px]">â€”</span> : (
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-12 h-1 bg-secondary rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full",
                                                r.accuracy >= 95 ? "bg-positive" : r.accuracy >= 80 ? "bg-info" : "bg-warning")}
                               style={{ width: `${r.accuracy}%` }} />
                        </div>
                        <span className="font-mono tnum text-[12px] w-8 text-right">{r.accuracy}%</span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 align-middle text-[12.5px] text-muted-foreground">{r.lastHit}</td>
                  <td className="px-3 align-middle">
                    <div className="flex flex-col gap-1">
                      <Badge variant={s.variant} dot={s.dot}>{s.label}</Badge>
                      <span className="text-[10.5px] text-text-soft">{r.owner}</span>
                    </div>
                  </td>
                  <td className="px-3 align-middle">
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                      <Button size="icon-sm" variant="ghost" title="Test">{I.zap}</Button>
                      <Button size="icon-sm" variant="ghost">{I.more}</Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <CardFooter>
          <div className="flex items-center justify-between w-full">
            <span>Showing <span className="font-mono text-foreground">{filtered.length}</span> of <span className="font-mono text-foreground">{RULES.length}</span> rules Â· drag to reorder priority</span>
            <span>Rules engine v3 Â· evaluated bottom-up</span>
          </div>
        </CardFooter>
      </Card>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
