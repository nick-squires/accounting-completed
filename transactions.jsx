/* global React, ReactDOM, PageShell, PageHeader, Button, Input, Kbd, Badge, Card, CardHeader, CardTitle,
            CardContent, CardFooter, Tabs, TabsTrigger, Avatar, AvatarRound, cn, I */

const { useState, useMemo } = React;

/* ---------- Transaction data ---------- */
const TXNS = [
  { id: "t1",  date: "May 24", iso: "2026-05-24", desc: "Square daily settlement",      memo: "Settlement batch 0524-A",    amount:  6210.40, account: "Chase Business ·5847", suggested: "4020 Retail café sales",         rule: "Square Settlement → 4020", confidence: "exact",  type: "credit", status: "review" },
  { id: "t2",  date: "May 24", iso: "2026-05-24", desc: "BLUE BOTTLE COFFEE",            memo: "INV-2241 Wholesale order",   amount: 12480.00, account: "Chase Business ·5847", suggested: "4010 Wholesale roasted coffee",  rule: "Blue Bottle → 4010",       confidence: "exact",  type: "credit", status: "review" },
  { id: "t3",  date: "May 23", iso: "2026-05-23", desc: "PG&E ELEC AUTOPAY",             memo: null,                         amount:  -842.18, account: "Chase Business ·5847", suggested: "6040 Utilities",                 rule: "PG&E → 6040",              confidence: "high",   type: "debit",  status: "review", needsAttn: true },
  { id: "t4",  date: "May 23", iso: "2026-05-23", desc: "STRIPE TRANSFER",               memo: "Stripe payout 2026-05-23",  amount:  3284.10, account: "Chase Business ·5847", suggested: "4030 Subscription box revenue",  rule: "Stripe → 4030",            confidence: "high",   type: "credit", status: "review" },
  { id: "t5",  date: "May 22", iso: "2026-05-22", desc: "ROASTERY LEASE LLC",            memo: "May rent",                   amount:-14800.00, account: "Chase Business ·5847", suggested: "6030 Rent & occupancy",          rule: "Roastery Lease → 6030",    confidence: "exact",  type: "debit",  status: "review" },
  { id: "t6",  date: "May 22", iso: "2026-05-22", desc: "AMZN MKTPLACE PMTS",            memo: "Office supplies",            amount:  -284.32, account: "Amex Platinum ·1124",  suggested: null,                              rule: null,                       confidence: "none",   type: "debit",  status: "review", needsAttn: true },
  { id: "t7",  date: "May 22", iso: "2026-05-22", desc: "CAFE IMPORTS LLC",              memo: "PO 8814 — Ethiopian Yirg.",  amount: -8940.00, account: "Chase Business ·5847", suggested: "5010 Green coffee purchases",    rule: "Cafe Imports → 5010",      confidence: "exact",  type: "debit",  status: "review" },
  { id: "t8",  date: "May 21", iso: "2026-05-21", desc: "GUSTO PAYROLL 052126",          memo: "Bi-weekly payroll",          amount:-38420.18, account: "Chase Business ·5847", suggested: "6010 Salaries & wages",          rule: "Gusto Payroll → 6010",     confidence: "exact",  type: "debit",  status: "review" },
  { id: "t9",  date: "May 21", iso: "2026-05-21", desc: "MAILCHIMP MONTHLY",             memo: null,                         amount:  -349.00, account: "Amex Platinum ·1124",  suggested: "6060 Software & subscriptions",  rule: "Mailchimp → 6060",         confidence: "high",   type: "debit",  status: "review" },
  { id: "t10", date: "May 20", iso: "2026-05-20", desc: "UNITED 0123 PHX-SFO",           memo: null,                         amount:  -428.20, account: "Amex Platinum ·1124",  suggested: "6080 Travel & entertainment",    rule: null,                       confidence: "med",    type: "debit",  status: "review", needsAttn: true },
  { id: "t11", date: "May 20", iso: "2026-05-20", desc: "TST*BLUE BOTTLE — Embarcadero", memo: "Client meeting w/ Adelina",  amount:  -42.50,  account: "Amex Platinum ·1124",  suggested: "6080 Travel & entertainment",    rule: null,                       confidence: "low",    type: "debit",  status: "review", needsAttn: true },
  { id: "t12", date: "May 20", iso: "2026-05-20", desc: "Square daily settlement",      memo: "Settlement batch 0520-A",    amount:  5840.10, account: "Chase Business ·5847", suggested: "4020 Retail café sales",         rule: "Square Settlement → 4020", confidence: "exact",  type: "credit", status: "review" },
  { id: "t13", date: "May 19", iso: "2026-05-19", desc: "UPWORK ESCROW",                 memo: "Freelance designer — May",   amount:  -2400.00,account: "Chase Business ·5847", suggested: "6050 Marketing & advertising",   rule: null,                       confidence: "med",    type: "debit",  status: "review" },
  { id: "t14", date: "May 19", iso: "2026-05-19", desc: "STATE FARM INS AUTOPAY",        memo: "Monthly premium",            amount:  -2480.00,account: "Chase Business ·5847", suggested: "6070 Insurance",                 rule: "State Farm → 6070",        confidence: "exact",  type: "debit",  status: "review" },
  { id: "t15", date: "May 19", iso: "2026-05-19", desc: "CHECK #2284",                   memo: null,                         amount: -1820.00, account: "Chase Business ·5847", suggested: null,                              rule: null,                       confidence: "none",   type: "debit",  status: "review", needsAttn: true },
];

const fmtAmt = (n) => {
  const abs = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (n < 0 ? "−" : "") + "$" + abs;
};

const CONFIDENCE = {
  exact: { label: "Exact match",  cls: "text-positive", icon: I.check },
  high:  { label: "High",         cls: "text-positive", icon: I.check },
  med:   { label: "Suggested",    cls: "text-info",     icon: I.zap },
  low:   { label: "Best guess",   cls: "text-warning",  icon: I.alert },
  none:  { label: "Uncategorized",cls: "text-text-soft",icon: I.alert },
};

/* ---------- Detail panel ---------- */
function DetailPanel({ t, onApprove, onSkip }) {
  if (!t) {
    return (
      <div className="bg-card border border-border rounded-lg p-10 text-center text-muted-foreground">
        <div className="text-foreground font-medium mb-1">Nothing selected</div>
        <div className="text-[13px]">Pick a transaction on the left to inspect, edit, or approve it.</div>
      </div>
    );
  }
  const conf = CONFIDENCE[t.confidence] || CONFIDENCE.none;
  const isIncome = t.amount > 0;

  return (
    <div className="bg-card border border-border rounded-lg shadow-elev-xs overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/60">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-text-soft mb-1">
              <span className="font-mono">{t.iso}</span>
              <span className="mx-1.5">·</span>
              <span>{t.account}</span>
            </div>
            <div className="text-[15px] font-medium truncate">{t.desc}</div>
            {t.memo && <div className="text-[12.5px] text-text-soft mt-0.5 truncate">{t.memo}</div>}
          </div>
          <Button variant="ghost" size="icon-sm">{I.x}</Button>
        </div>
        <div className={cn("font-mono tnum text-[32px] leading-none font-medium tracking-tight mt-4",
                            isIncome ? "text-positive" : "text-foreground")}>
          {fmtAmt(t.amount)}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-5">
        {/* Category */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] uppercase tracking-wider text-text-soft font-medium">Category</label>
            <span className={cn("flex items-center gap-1 text-[11px]", conf.cls)}>
              <span className="w-3 h-3 grid place-items-center">{conf.icon}</span>
              {conf.label}
            </span>
          </div>
          <div className={cn("h-10 px-3 rounded-md border bg-card text-foreground flex items-center justify-between gap-2 cursor-pointer hover:border-border-strong transition-colors",
                              t.suggested ? "border-border" : "border-warning/40 bg-warning-soft/40")}>
            <div className="flex items-center gap-2 min-w-0">
              {t.suggested ? (
                <>
                  <span className="font-mono text-[11px] text-text-soft">{t.suggested.split(" ")[0]}</span>
                  <span className="text-[13.5px] truncate">{t.suggested.split(" ").slice(1).join(" ")}</span>
                </>
              ) : (
                <span className="text-[13.5px] text-warning font-medium">Choose a category…</span>
              )}
            </div>
            <span className="text-text-soft">{I.chevDown}</span>
          </div>
        </div>

        {/* Customer / Vendor */}
        <div>
          <label className="text-[11px] uppercase tracking-wider text-text-soft font-medium block mb-1.5">
            {isIncome ? "Customer" : "Vendor / payee"}
          </label>
          <Input placeholder={isIncome ? "Apply to customer (optional)" : "Apply to vendor (optional)"} />
        </div>

        {/* Memo */}
        <div>
          <label className="text-[11px] uppercase tracking-wider text-text-soft font-medium block mb-1.5">Memo</label>
          <textarea
            className="w-full min-h-[64px] px-3 py-2 rounded-md border border-input bg-card text-[13.5px] resize-y focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
            defaultValue={t.memo || ""}
            placeholder="Notes for your future self…"
          />
        </div>

        {/* Attach receipt */}
        <div>
          <label className="text-[11px] uppercase tracking-wider text-text-soft font-medium block mb-1.5">Attachments</label>
          <button className="w-full h-20 rounded-md border border-dashed border-border-strong text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex flex-col items-center justify-center gap-1">
            <span className="w-4 h-4 grid place-items-center">{I.plus}</span>
            <span className="text-[12px]">Drop receipt or click to upload</span>
          </button>
        </div>

        {/* Rule */}
        {t.rule && (
          <div className="bg-accent rounded-md p-3 flex items-start gap-3">
            <span className="w-4 h-4 text-primary mt-0.5">{I.zap}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-medium text-primary">Rule applied</div>
              <div className="text-[12px] text-primary/80 font-mono truncate">{t.rule}</div>
            </div>
            <button className="text-[11.5px] text-primary hover:underline whitespace-nowrap">Edit</button>
          </div>
        )}

        {/* Similar */}
        <div>
          <div className="text-[11px] uppercase tracking-wider text-text-soft font-medium mb-2">
            Similar transactions
          </div>
          <div className="border border-border rounded-md divide-y divide-border/60 overflow-hidden">
            {[
              { date: "May 13", desc: t.desc, amount: t.amount * 0.94, cat: t.suggested || "Uncategorized" },
              { date: "May 06", desc: t.desc, amount: t.amount * 1.08, cat: t.suggested || "Uncategorized" },
              { date: "Apr 29", desc: t.desc, amount: t.amount * 0.97, cat: t.suggested || "Uncategorized" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 px-3 h-9 text-[12.5px]">
                <span className="font-mono text-text-soft w-12">{s.date}</span>
                <span className="flex-1 truncate text-muted-foreground">{s.cat}</span>
                <span className={cn("font-mono tnum", s.amount > 0 ? "text-positive" : "text-foreground")}>
                  {fmtAmt(s.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="border-t border-border bg-muted/60 px-5 py-3 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onSkip}>Skip for now</Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm">{I.x}<span>Exclude</span></Button>
        <Button variant="primary" onClick={onApprove}>
          {I.check}<span>Approve & next</span>
          <span className="ml-1 opacity-70"><Kbd>↵</Kbd></span>
        </Button>
      </div>
    </div>
  );
}

/* ---------- App ---------- */
function App() {
  const [tab, setTab] = useState("review");
  const [account, setAccount] = useState("all"); // all | chase | amex
  const [selected, setSelected] = useState("t1");
  const [checked, setChecked] = useState(new Set());
  const [q, setQ] = useState("");

  const visible = useMemo(() => {
    let list = TXNS;
    if (account === "chase") list = list.filter(t => t.account.startsWith("Chase"));
    if (account === "amex")  list = list.filter(t => t.account.startsWith("Amex"));
    if (q) {
      const n = q.toLowerCase();
      list = list.filter(t => t.desc.toLowerCase().includes(n) || (t.memo || "").toLowerCase().includes(n));
    }
    return list;
  }, [account, q]);

  const sel = TXNS.find(t => t.id === selected);

  const toggleCheck = (id) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (checked.size === visible.length) setChecked(new Set());
    else setChecked(new Set(visible.map(t => t.id)));
  };

  const onApprove = () => {
    // pick next un-approved
    const i = visible.findIndex(t => t.id === selected);
    setSelected(visible[i + 1]?.id || visible[0]?.id);
  };
  const onSkip = onApprove;

  return (
    <PageShell activeKey="txns" crumbs={["Transactions"]}>
      <PageHeader
        title="Transactions"
        sub={<>Atlas Coffee Roasters · <span className="font-mono text-foreground font-medium">42 to review</span> across 2 accounts</>}
        actions={
          <>
            <Button>{I.refresh}<span>Refresh feeds</span></Button>
            <Button>{I.zap}<span>Rules</span></Button>
            <Button>{I.download}<span>Export</span></Button>
            <Button variant="primary">{I.plus}<span>Add transaction</span></Button>
          </>
        }
      />

      {/* Tab strip */}
      <div className="flex items-center gap-1 mb-4 border-b border-border">
        {[
          { v: "review",     l: "For review",  c: 42 },
          { v: "categorized",l: "Categorized", c: 1284 },
          { v: "excluded",   l: "Excluded",    c: 18 },
          { v: "all",        l: "All",         c: 1344 },
        ].map(opt => (
          <button key={opt.v}
                  onClick={() => setTab(opt.v)}
                  className={cn(
                    "px-3 py-2.5 text-[13.5px] font-medium border-b-2 -mb-px transition-colors",
                    tab === opt.v
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}>
            {opt.l}
            <span className={cn("ml-1.5 font-mono tnum text-[11px]",
                                  tab === opt.v ? "text-primary" : "text-text-soft")}>
              {opt.c}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[280px] max-w-md">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-soft">{I.search}</span>
          <input value={q} onChange={(e) => setQ(e.target.value)}
                 placeholder="Search descriptions, memos, amounts…"
                 className="w-full h-8 pl-8 pr-3 rounded-md bg-card border border-border text-[13.5px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/30" />
        </div>
        <div className="flex items-center gap-1 bg-card border border-border rounded-md p-[3px]">
          {[
            { v: "all",   l: "All accounts" },
            { v: "chase", l: "Chase ·5847" },
            { v: "amex",  l: "Amex ·1124" },
          ].map(opt => (
            <button key={opt.v} onClick={() => setAccount(opt.v)}
                    className={cn("h-6 px-3 rounded text-[12px] font-medium transition-colors",
                                    account === opt.v ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")}>
              {opt.l}
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline">{I.cal}<span>This month</span></Button>
        <Button size="sm" variant="outline">{I.filter}<span>More filters</span></Button>
      </div>

      {/* Bulk bar */}
      {checked.size > 0 && (
        <div className="flex items-center gap-3 mb-3 px-4 h-11 bg-accent rounded-md border border-primary/20">
          <span className="font-mono tnum text-primary font-medium">{checked.size}</span>
          <span className="text-primary text-[13px]">selected</span>
          <div className="flex-1" />
          <Button size="sm" variant="primary">{I.check}<span>Approve all</span></Button>
          <Button size="sm">{I.cats}<span>Recategorize</span></Button>
          <Button size="sm" variant="ghost">{I.x}<span>Exclude</span></Button>
          <Button size="sm" variant="ghost" onClick={() => setChecked(new Set())}>Clear</Button>
        </div>
      )}

      {/* Split layout: table + detail */}
      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 420px" }}>
        <Card className="overflow-hidden">
          <table className="w-full text-[13.5px]">
            <thead className="bg-muted/60 border-b border-border">
              <tr>
                <th className="w-10 px-3 h-9">
                  <input type="checkbox"
                         checked={checked.size === visible.length && visible.length > 0}
                         onChange={toggleAll}
                         className="w-3.5 h-3.5 rounded-sm accent-primary cursor-pointer" />
                </th>
                <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[80px]">Date</th>
                <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium">Description</th>
                <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[260px]">Suggested category</th>
                <th className="text-right px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[140px]">Amount</th>
                <th className="w-[120px]"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map(t => {
                const conf = CONFIDENCE[t.confidence] || CONFIDENCE.none;
                const isSel = t.id === selected;
                const isChecked = checked.has(t.id);
                return (
                  <tr key={t.id}
                      onClick={() => setSelected(t.id)}
                      className={cn(
                        "border-b border-border/60 cursor-pointer transition-colors group",
                        isSel ? "bg-accent" : isChecked ? "bg-muted/60" : "hover:bg-muted/60"
                      )}
                      style={{ height: "var(--row-h, 48px)" }}>
                    <td className="px-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox"
                             checked={isChecked}
                             onChange={() => toggleCheck(t.id)}
                             className="w-3.5 h-3.5 rounded-sm accent-primary cursor-pointer" />
                    </td>
                    <td className="px-3 font-mono text-[12.5px] text-muted-foreground">{t.date}</td>
                    <td className="px-3">
                      <div className="flex items-center gap-2">
                        {t.needsAttn && <span className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" title="Needs your attention" />}
                        <div className="min-w-0">
                          <div className="font-medium truncate">{t.desc}</div>
                          {t.memo && <div className="text-[11.5px] text-text-soft truncate">{t.memo}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3">
                      {t.suggested ? (
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={cn("w-3 h-3 flex-shrink-0", conf.cls)}>{conf.icon}</span>
                          <span className="text-[13px] truncate">{t.suggested.split(" ").slice(1).join(" ")}</span>
                        </div>
                      ) : (
                        <span className="text-[13px] text-warning font-medium flex items-center gap-1.5">
                          <span className="w-3 h-3">{I.alert}</span>
                          Uncategorized
                        </span>
                      )}
                    </td>
                    <td className={cn("px-3 text-right font-mono tnum font-medium",
                                       t.amount > 0 ? "text-positive" : "text-foreground")}>
                      {fmtAmt(t.amount)}
                    </td>
                    <td className="px-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {t.suggested && (
                          <Button size="sm" variant="primary" className="h-7 px-2.5">
                            <span className="w-3 h-3 grid place-items-center">{I.check}</span>
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 justify-center">{I.more}</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <CardFooter>
            <div className="flex items-center justify-between w-full">
              <span>Showing <span className="font-mono text-foreground">{visible.length}</span> of 42 · <a href="#" className="text-primary hover:underline">Load more →</a></span>
              <span className="flex items-center gap-2">
                <Kbd>↑</Kbd><Kbd>↓</Kbd> navigate
                <span className="mx-1">·</span>
                <Kbd>↵</Kbd> approve
                <span className="mx-1">·</span>
                <Kbd>E</Kbd> edit
              </span>
            </div>
          </CardFooter>
        </Card>

        <div className="min-w-0">
          <DetailPanel t={sel} onApprove={onApprove} onSkip={onSkip} />
        </div>
      </div>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
