/* global React, ReactDOM, PageShell, Button, Input, Badge, Card, CardHeader, CardTitle, CardFooter,
            Avatar, AvatarRound, Sparkline, cn, I */

const { useState } = React;

const QUEUE = [
  { id: "r1", type: "P&L",          period: "May 2026",      client: "Atlas Coffee Roasters",  preparer: "Scott T.", age: "2h",  amount: "$184,200", priority: "high"   },
  { id: "r2", type: "Balance Sheet",period: "May 2026",      client: "Atlas Coffee Roasters",  preparer: "Scott T.", age: "2h",  amount: "â€”",        priority: "high"   },
  { id: "r3", type: "P&L",          period: "May 2026",      client: "Kestrel Studio",          preparer: "Marcus T.", age: "5h",  amount: "$42,180",  priority: "normal" },
  { id: "r4", type: "P&L",          period: "April 2026",    client: "Northstar Logistics",     preparer: "Priya S.",  age: "1d",  amount: "$184,200", priority: "low"    },
  { id: "r5", type: "Year-end pkg.",period: "FY 2025",       client: "Highwire Climbing",       preparer: "Marcus T.", age: "3d",  amount: "â€”",        priority: "normal" },
];

const COMMENTS = [
  { who: "Scott T.", initials: "ST", time: "2h ago",
    text: "Marketing spend bumped 60% vs April due to the Brew/Sip launch â€” confirmed with Diego. Tagging it for the variance note.",
    role: "preparer" },
  { who: "Priya S.",  initials: "PS", time: "1h ago",
    text: "Looks reasonable. Two questions:\n1) Is the Upwork freelancer cost going under 6050 or shouldn't it be COGS?\n2) Inventory shrink â€” confirm with the physical count?",
    role: "reviewer" },
  { who: "Scott T.", initials: "ST", time: "45m ago",
    text: "1) 6050 is right â€” that's marketing design work, not coffee. 2) Already confirmed shrink. JE-2026-0037.",
    role: "preparer" },
];

const CHECKLIST = [
  { label: "Bank reconciliation complete", done: true, note: "3/3 accounts Â· last variance $0.00" },
  { label: "All transactions categorized", done: true, note: "0 in review queue" },
  { label: "AR + AP reviewed", done: true, note: "AR $48,220 Â· AP $38,420" },
  { label: "Depreciation entry posted", done: true, note: "JE-2026-0042" },
  { label: "Trial balance balances", done: true, note: "Debits = Credits" },
  { label: "Period locked", done: false, note: "will lock on approval" },
];

const REPORT_LINES = [
  { label: "Wholesale roasted coffee",  value: 224180, type: "income" },
  { label: "Retail cafÃ© sales",          value: 168340, type: "income" },
  { label: "Subscription box revenue",   value:  55980, type: "income" },
  { label: "Merchandise & retail",       value:  16450, type: "income" },
  { label: "Other operating income",     value:   1420, type: "income" },
  { label: "Total income",               value: 466370, type: "subtotal" },
  { label: "Green coffee purchases",     value:-105420, type: "cogs"   },
  { label: "Roasting labor",             value: -26100, type: "cogs"   },
  { label: "Packaging & supplies",       value: -13680, type: "cogs"   },
  { label: "Freight in",                 value:  -8210, type: "cogs"   },
  { label: "Total COGS",                 value:-153410, type: "subtotal" },
  { label: "Gross profit",               value: 312960, type: "gross" },
  { label: "Salaries & wages",           value: -82100, type: "opex"   },
  { label: "Payroll taxes & benefits",   value: -19320, type: "opex"   },
  { label: "Rent & occupancy",           value: -14800, type: "opex"   },
  { label: "Marketing & advertising",    value: -14620, type: "opex"   },
  { label: "Other operating expenses",   value: -16110, type: "opex"   },
  { label: "Total operating expenses",   value:-146950, type: "subtotal" },
  { label: "Net income",                 value: 166010, type: "net"    },
];

const fmtAmt = (n) => {
  const abs = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return n < 0 ? `(${abs})` : abs;
};

const PRIORITY_PILL = {
  high:   { variant: "warning",     label: "High" },
  normal: { variant: "info",        label: "Normal" },
  low:    { variant: "default",     label: "Low" },
};

function App() {
  const [selectedId, setSelectedId] = useState("r1");
  const selected = QUEUE.find(r => r.id === selectedId);

  return (
    <PageShell activeKey="approve" crumbs={["Reports", "Approve reports"]} mainClassName="p-0">
      <div className="grid h-full" style={{ gridTemplateColumns: "340px 1fr" }}>

        {/* ---------- Queue list ---------- */}
        <aside className="border-r border-border bg-card flex flex-col overflow-hidden">
          <div className="px-4 py-4 border-b border-border/60 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold">Approval queue</h2>
              <p className="text-[11.5px] text-text-soft">{QUEUE.length} reports awaiting your review</p>
            </div>
            <Button size="icon-sm" variant="ghost">{I.filter}</Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {QUEUE.map(r => {
              const p = PRIORITY_PILL[r.priority];
              const active = r.id === selectedId;
              return (
                <button key={r.id} onClick={() => setSelectedId(r.id)}
                        className={cn(
                          "w-full px-4 py-3 border-b border-border/60 text-left flex flex-col gap-1.5 transition-colors",
                          active ? "bg-accent" : "hover:bg-muted/40"
                        )}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("font-medium text-[13.5px]", active ? "text-primary" : "")}>{r.type} Â· {r.period}</span>
                    <Badge variant={p.variant} dot={r.priority !== "low"}>{p.label}</Badge>
                  </div>
                  <div className="text-[12px] text-foreground truncate">{r.client}</div>
                  <div className="flex items-center justify-between text-[11px] text-text-soft">
                    <span>by {r.preparer}</span>
                    <span className="font-mono tnum">{r.age} ago Â· {r.amount}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="border-t border-border/60 px-4 py-3 text-[11.5px] text-text-soft">
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-warning" /> 2 overdue
              <span className="mx-2">Â·</span>
              <span className="w-1.5 h-1.5 rounded-full bg-positive" /> avg approval 4.2h
            </span>
          </div>
        </aside>

        {/* ---------- Report detail ---------- */}
        <section className="overflow-auto p-6 md:p-8 bg-muted/30">
          {/* Report header */}
          <div className="flex items-start justify-between gap-6 mb-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-[12.5px] text-text-soft mb-1">
                <span>For review</span>
                <span>Â·</span>
                <span className="font-mono">{selected.id.toUpperCase()}-{selected.period.replace(" ", "-").toUpperCase()}</span>
              </div>
              <h1 className="text-[26px] leading-7 font-semibold tracking-tight m-0 mb-1">
                {selected.type} Â· {selected.period}
              </h1>
              <p className="text-[14px] text-muted-foreground">
                <span className="font-medium text-foreground">{selected.client}</span> Â· prepared by <span className="font-medium text-foreground">{selected.preparer}</span> Â· awaiting your sign-off
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button>{I.print}<span>Print preview</span></Button>
              <Button>{I.download}<span>Download PDF</span></Button>
              <Button variant="ghost" size="icon">{I.more}</Button>
            </div>
          </div>

          {/* Main split: report + rail */}
          <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 360px" }}>
            {/* Embedded report */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CardTitle>Income statement preview</CardTitle>
                  <span className="text-[12px] text-muted-foreground">May 1 â†’ May 31, 2026 Â· accrual basis</span>
                </div>
                <a href="Profit %26 Loss.html" className="text-[12px] text-primary hover:underline">Open full report â†’</a>
              </CardHeader>
              <table className="w-full text-[13.5px]">
                <tbody>
                  {REPORT_LINES.map((l, i) => {
                    const isSubtotal = l.type === "subtotal";
                    const isGross    = l.type === "gross";
                    const isNet      = l.type === "net";
                    return (
                      <tr key={i} className={cn(
                        isSubtotal && "bg-muted/40 border-t border-b border-border-strong font-semibold",
                        isGross && "bg-accent text-primary border-t border-b border-primary/30 font-semibold",
                        isNet && "bg-card border-t-2 border-border-strong font-semibold",
                      )}
                      style={isNet ? { borderBottom: "3px double hsl(var(--border-strong))" } : {}}>
                        <td className={cn(
                          "px-5 align-middle",
                          !isSubtotal && !isGross && !isNet && "pl-9"
                        )}
                        style={{ height: 32 }}>
                          {l.label}
                        </td>
                        <td className="px-5 align-middle text-right font-mono tnum">
                          {fmtAmt(l.value)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>

            {/* Right rail */}
            <div className="flex flex-col gap-4 min-w-0">
              {/* Preparer block */}
              <Card>
                <div className="p-4">
                  <div className="text-[11px] uppercase tracking-wider text-text-soft font-medium mb-2">Prepared by</div>
                  <div className="flex items-center gap-3 mb-3">
                    <AvatarRound size={32}>ST</AvatarRound>
                    <div>
                      <div className="text-[13.5px] font-medium">{selected.preparer === "Scott T." ? "Scott Turner" : selected.preparer}</div>
                      <div className="text-[11.5px] text-text-soft">Senior bookkeeper Â· submitted 2h ago</div>
                    </div>
                  </div>
                  <div className="rounded-md bg-muted/60 p-3 text-[12.5px] text-muted-foreground italic" style={{ textWrap: "pretty" }}>
                    "Strong month â€” marketing spend up vs April but variance accepted by owner. Ready for sign-off."
                  </div>
                </div>
              </Card>

              {/* Checklist */}
              <Card>
                <CardHeader>
                  <CardTitle>Pre-flight checklist</CardTitle>
                  <span className="text-[11px] text-text-soft">{CHECKLIST.filter(c => c.done).length}/{CHECKLIST.length}</span>
                </CardHeader>
                <div className="p-4 space-y-2">
                  {CHECKLIST.map((c, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className={cn("w-4 h-4 rounded-full grid place-items-center flex-shrink-0 mt-0.5",
                                              c.done ? "bg-positive text-white" : "border-2 border-border-strong bg-card")}>
                        {c.done && <span className="w-2.5 h-2.5">{I.check}</span>}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className={cn("text-[12.5px]", c.done ? "text-foreground" : "text-warning font-medium")}>{c.label}</div>
                        <div className="text-[11px] text-text-soft">{c.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Comments */}
              <Card>
                <CardHeader>
                  <CardTitle>Discussion</CardTitle>
                  <span className="text-[11px] text-text-soft">{COMMENTS.length} comments</span>
                </CardHeader>
                <div className="p-4 space-y-3 max-h-[340px] overflow-y-auto">
                  {COMMENTS.map((c, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <AvatarRound size={26}>{c.initials}</AvatarRound>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[12px] font-medium">{c.who}</span>
                          <span className="text-[10.5px] text-text-soft uppercase tracking-wider">{c.role}</span>
                          <span className="text-[10.5px] text-text-soft">Â· {c.time}</span>
                        </div>
                        <div className="text-[12.5px] whitespace-pre-wrap" style={{ textWrap: "pretty" }}>{c.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border/60 p-3 flex items-center gap-2">
                  <input placeholder="Reply or @mentionâ€¦"
                         className="flex-1 h-8 px-3 rounded-md bg-card border border-input text-[13px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/30" />
                  <Button size="sm" variant="primary">Post</Button>
                </div>
              </Card>
            </div>
          </div>

          {/* Sticky action bar */}
          <div className="mt-6 flex items-center gap-3 bg-card border border-border rounded-lg shadow-elev-sm p-4">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[14px]">Ready to sign off on the May 2026 P&amp;L?</div>
              <div className="text-[12px] text-muted-foreground">Approving will lock the period and send the report to Diego at Atlas Coffee Roasters.</div>
            </div>
            <Button variant="ghost">{I.x}<span>Request changes</span></Button>
            <Button>Save as draft</Button>
            <Button variant="primary">{I.approve}<span>Approve & send</span></Button>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
