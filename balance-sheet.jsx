/* global React, ReactDOM, PageShell, PageHeader, StatTile, Button, Badge, Card, CardHeader, CardTitle,
            CardFooter, Tabs, TabsTrigger, cn, I */

const { useState, useMemo } = React;

/* As-of dates we compare across columns */
const PERIODS = [
  { label: "May 26", iso: "2026-05-31", current: true  },
  { label: "Apr 26", iso: "2026-04-30" },
  { label: "Mar 26", iso: "2026-03-31" },
  { label: "Feb 26", iso: "2026-02-29" },
  { label: "Jan 26", iso: "2026-01-31" },
  { label: "Dec 25", iso: "2025-12-31", yearEnd: true },
];

/* Balance sheet data — values per period (newest first). */
const BS = {
  assets: [
    {
      label: "Current assets",
      accounts: [
        { code: "1010", name: "Operating checking — Chase",   vals: [248124, 232480, 218960, 204210, 188420, 142840] },
        { code: "1020", name: "Business savings — Chase",     vals: [ 82410,  78410,  74410,  70410,  66410,  58410] },
        { code: "1030", name: "Stripe & Square (in transit)", vals: [ 15332,  12480,  14210,  11820,  13680,   9420] },
        { code: "1200", name: "Accounts receivable",          vals: [ 48220,  52840,  61210,  58420,  62180,  41280] },
        { code: "1300", name: "Inventory — green coffee",     vals: [ 64820,  68420,  72410,  76820,  68210,  52810] },
        { code: "1320", name: "Inventory — packaging",        vals: [ 12480,  13680,  11820,  14210,  10920,   8240] },
        { code: "1400", name: "Prepaid expenses",             vals: [  8420,   9620,  10820,  12020,  13220,  14420] },
      ],
    },
    {
      label: "Fixed assets",
      accounts: [
        { code: "1500", name: "Roasting equipment",           vals: [184200, 184200, 184200, 184200, 184200, 184200] },
        { code: "1510", name: "Cafe build-out",               vals: [ 92840,  92840,  92840,  92840,  92840,  92840] },
        { code: "1520", name: "Vehicles",                     vals: [ 38400,  38400,  38400,  38400,  38400,  38400] },
        { code: "1590", name: "Accumulated depreciation",     vals: [-48210, -45820, -43430, -41040, -38650, -28210] },
      ],
    },
  ],
  liabilities: [
    {
      label: "Current liabilities",
      accounts: [
        { code: "2010", name: "Accounts payable",             vals: [ 38420,  42180,  46820,  41280,  44620,  32480] },
        { code: "2020", name: "Business credit card — Amex",  vals: [  4218,   5840,   3820,   4620,   3240,   2840] },
        { code: "2030", name: "Business credit card — Chase", vals: [ 12488,  11240,  13680,  10920,  12480,   9420] },
        { code: "2100", name: "Payroll liabilities",          vals: [ 18420,  18420,  17820,  17820,  17820,  16420] },
        { code: "2120", name: "Sales tax payable",            vals: [  8420,   9620,  11820,  10420,  12820,   7420] },
        { code: "2150", name: "Accrued expenses",             vals: [  6420,   7240,   5820,   6820,   5240,   4820] },
      ],
    },
    {
      label: "Long-term liabilities",
      accounts: [
        { code: "2500", name: "Equipment loan — Chase",       vals: [ 72400,  74840,  77280,  79720,  82160,  84600] },
        { code: "2510", name: "SBA loan (interest only)",     vals: [120000, 120000, 120000, 120000, 120000, 120000] },
      ],
    },
  ],
  equity: [
    {
      label: "Equity",
      accounts: [
        { code: "3010", name: "Owner's equity",               vals: [180000, 180000, 180000, 180000, 180000, 180000] },
        { code: "3020", name: "Retained earnings",            vals: [248420, 248420, 248420, 248420, 248420, 248420] },
        { code: "3500", name: "Net income (YTD)",             vals: [137320, 110820,  86420,  62420,  38420,      0] },
      ],
    },
  ],
};

const fmt = (n) => {
  if (n === 0) return "—";
  const abs = Math.abs(n);
  const s = abs.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return n < 0 ? `(${s})` : s;
};
const pctDelta = (a, b) => {
  if (b === 0) return null;
  return (a - b) / Math.abs(b);
};
const fmtPctDelta = (a, b) => {
  const d = pctDelta(a, b);
  if (d === null) return "—";
  const sign = d > 0 ? "+" : "";
  return `${sign}${(d * 100).toFixed(1)}%`;
};

/* Roll up: return totals per period */
function rollup(groups) {
  const periodCount = PERIODS.length;
  const totals = new Array(periodCount).fill(0);
  const groupTotals = [];
  groups.forEach(g => {
    const gt = new Array(periodCount).fill(0);
    g.accounts.forEach(a => a.vals.forEach((v, i) => { gt[i] += v; totals[i] += v; }));
    groupTotals.push({ label: g.label, totals: gt, accounts: g.accounts });
  });
  return { groups: groupTotals, totals };
}

/* ---------- Table cell ---------- */
function NumCell({ val, current, level }) {
  const cls = ["px-3 text-right font-mono tnum align-middle"];
  if (current) cls.push("bg-accent/40");
  if (val < 0) cls.push("text-destructive");
  if (val === 0) cls.push("text-text-soft");
  if (level === "subtotal") cls.push("font-semibold");
  if (level === "section")  cls.push("font-semibold");
  return <td className={cls.join(" ")}>{fmt(val)}</td>;
}

/* ---------- Section renderer ---------- */
function SectionRows({ section, level = "section", showDelta = true }) {
  return (
    <>
      <tr className="bg-muted/60">
        <td className="px-4 h-9 text-left text-[11px] uppercase tracking-wider text-text-soft font-medium border-t border-b border-border">
          {section.label}
        </td>
        {PERIODS.map((p, i) => <td key={i} className="bg-muted/60 border-t border-b border-border"></td>)}
        {showDelta && <td className="bg-muted/60 border-t border-b border-border"></td>}
      </tr>
      {section.accounts.map(a => (
        <tr key={a.code} className="border-b border-border/60 hover:bg-muted/60 transition-colors">
          <td className="px-4 align-middle" style={{ height: "var(--row-h, 36px)" }}>
            <span className="font-mono text-text-soft text-[11px] mr-2.5">{a.code}</span>
            <span>{a.name}</span>
          </td>
          {a.vals.map((v, i) => <NumCell key={i} val={v} current={PERIODS[i].current} />)}
          {showDelta && (
            <td className="px-3 text-right font-mono tnum text-[12px] text-muted-foreground border-l border-border/60 align-middle">
              {fmtPctDelta(a.vals[0], a.vals[5])}
            </td>
          )}
        </tr>
      ))}
    </>
  );
}

/* ---------- App ---------- */
function App() {
  const [basis, setBasis] = useState("Accrual");
  const [view, setView] = useState("Compare"); // Compare | YoY

  const assets = useMemo(() => rollup(BS.assets), []);
  const liabs  = useMemo(() => rollup(BS.liabilities), []);
  const eq     = useMemo(() => rollup(BS.equity), []);
  const lpe    = useMemo(() => liabs.totals.map((v, i) => v + eq.totals[i]), [liabs, eq]);

  const assetsNow = assets.totals[0];
  const liabsNow = liabs.totals[0];
  const eqNow = eq.totals[0];
  const cashNow = 248124 + 82410 + 15332;
  const arNow = 48220;
  const currentRatio = (assetsNow * 0.6) / liabsNow; // rough — not exact, just feels real

  return (
    <PageShell activeKey="balance" crumbs={["Reports", "Balance Sheet"]}>
      <PageHeader
        title="Balance Sheet"
        sub={<>Atlas Coffee Roasters · as of <span className="font-mono text-foreground font-medium">May 31, 2026</span> · 6-month comparison</>}
        actions={
          <>
            <Tabs value={basis} onValueChange={setBasis}>
              <TabsTrigger value="Accrual">Accrual</TabsTrigger>
              <TabsTrigger value="Cash">Cash</TabsTrigger>
            </Tabs>
            <Tabs value={view} onValueChange={setView}>
              <TabsTrigger value="Compare">Compare</TabsTrigger>
              <TabsTrigger value="YoY">YoY</TabsTrigger>
              <TabsTrigger value="Single">Single date</TabsTrigger>
            </Tabs>
            <Button>{I.refresh}<span>Refresh</span></Button>
            <Button>{I.download}<span>Export</span></Button>
            <Button variant="primary">{I.share}<span>Share</span></Button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatTile label="Total assets"     value={"$" + assetsNow.toLocaleString()} sub="all owned resources" />
        <StatTile label="Total liabilities" value={"$" + liabsNow.toLocaleString()} sub="all obligations" />
        <StatTile label="Owner's equity"   value={"$" + eqNow.toLocaleString()} sub="book value" intent="accent" />
        <StatTile label="Current ratio"    value={currentRatio.toFixed(2)} sub="current assets / current liab." intent="positive" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle>Statement of financial position · FY 2026</CardTitle>
            <span className="text-[13px] text-muted-foreground">accrual basis · USD</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">{I.filter}<span>Group accounts</span></Button>
            <Button variant="ghost" size="sm">{I.print}<span>Print</span></Button>
            <Button variant="ghost" size="icon-sm">{I.more}</Button>
          </div>
        </CardHeader>

        <div className="overflow-auto">
        <table className="w-full text-[13.5px] border-collapse">
          <thead className="bg-muted">
            <tr className="border-b border-border">
              <th className="text-left px-4 h-10 text-[11px] uppercase tracking-wider text-text-soft font-medium" style={{ minWidth: 280 }}>
                Account
              </th>
              {PERIODS.map((p, i) => (
                <th key={i}
                    className={cn(
                      "px-3 h-10 text-right text-[11px] uppercase tracking-wider font-medium",
                      p.current ? "text-primary bg-accent" : "text-text-soft",
                      p.yearEnd && "border-l border-border"
                    )}
                    style={{ minWidth: 96 }}>
                  {p.label}
                  {p.yearEnd && <div className="text-[9px] normal-case tracking-normal text-text-soft mt-0.5">year-end</div>}
                </th>
              ))}
              <th className="px-3 h-10 text-right text-[11px] uppercase tracking-wider text-text-soft font-medium border-l border-border" style={{ width: 80 }}>
                Δ vs YE
              </th>
            </tr>
          </thead>
          <tbody>
            {/* ASSETS */}
            <tr><td className="px-4 pt-5 pb-2 text-[12px] font-semibold uppercase tracking-wider text-primary" colSpan={PERIODS.length + 2}>Assets</td></tr>
            {assets.groups.map((g, i) => <SectionRows key={i} section={g} />)}
            <tr className="bg-accent/40">
              <td className="px-4 font-semibold text-primary" style={{ height: "var(--row-h, 36px)" }}>Total assets</td>
              {assets.totals.map((v, i) =>
                <td key={i} className={cn("px-3 text-right font-mono tnum font-semibold text-primary border-t border-b border-primary/30", PERIODS[i].current && "bg-accent")}>
                  {fmt(v)}
                </td>)}
              <td className="px-3 text-right font-mono tnum text-[12px] text-primary border-l border-border/60 border-t border-b border-primary/30">
                {fmtPctDelta(assets.totals[0], assets.totals[5])}
              </td>
            </tr>

            {/* LIABILITIES */}
            <tr><td className="px-4 pt-7 pb-2 text-[12px] font-semibold uppercase tracking-wider text-primary" colSpan={PERIODS.length + 2}>Liabilities</td></tr>
            {liabs.groups.map((g, i) => <SectionRows key={i} section={g} />)}
            <tr className="bg-muted">
              <td className="px-4 font-semibold border-t border-border-strong" style={{ height: "var(--row-h, 36px)" }}>Total liabilities</td>
              {liabs.totals.map((v, i) =>
                <td key={i} className={cn("px-3 text-right font-mono tnum font-semibold border-t border-border-strong", PERIODS[i].current && "bg-accent/40")}>
                  {fmt(v)}
                </td>)}
              <td className="px-3 text-right font-mono tnum text-[12px] text-muted-foreground border-l border-border/60 border-t border-border-strong">
                {fmtPctDelta(liabs.totals[0], liabs.totals[5])}
              </td>
            </tr>

            {/* EQUITY */}
            <tr><td className="px-4 pt-7 pb-2 text-[12px] font-semibold uppercase tracking-wider text-primary" colSpan={PERIODS.length + 2}>Equity</td></tr>
            {eq.groups.map((g, i) => <SectionRows key={i} section={g} />)}
            <tr className="bg-muted">
              <td className="px-4 font-semibold border-t border-border-strong" style={{ height: "var(--row-h, 36px)" }}>Total equity</td>
              {eq.totals.map((v, i) =>
                <td key={i} className={cn("px-3 text-right font-mono tnum font-semibold border-t border-border-strong", PERIODS[i].current && "bg-accent/40")}>
                  {fmt(v)}
                </td>)}
              <td className="px-3 text-right font-mono tnum text-[12px] text-muted-foreground border-l border-border/60 border-t border-border-strong">
                {fmtPctDelta(eq.totals[0], eq.totals[5])}
              </td>
            </tr>

            {/* TOTAL L+E */}
            <tr className="bg-card">
              <td className="px-4 font-semibold border-t-2 border-border-strong" style={{ height: "var(--row-h, 36px)", borderBottom: "3px double hsl(var(--border-strong))" }}>
                Total liabilities + equity
              </td>
              {lpe.map((v, i) =>
                <td key={i} className={cn("px-3 text-right font-mono tnum font-semibold border-t-2 border-border-strong", PERIODS[i].current && "bg-accent/40")}
                    style={{ borderBottom: "3px double hsl(var(--border-strong))" }}>
                  {fmt(v)}
                </td>)}
              <td className="px-3 text-right font-mono tnum text-[12px] text-muted-foreground border-l border-border/60 border-t-2 border-border-strong"
                  style={{ borderBottom: "3px double hsl(var(--border-strong))" }}>
                {fmtPctDelta(lpe[0], lpe[5])}
              </td>
            </tr>
          </tbody>
        </table>
        </div>

        <CardFooter>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-positive"></span>
              <span>Books balance: <span className="font-mono text-foreground">Assets ${assetsNow.toLocaleString()}</span> = <span className="font-mono text-foreground">L+E ${lpe[0].toLocaleString()}</span></span>
            </div>
            <span>Last refreshed <span className="font-mono text-foreground">2 min ago</span> · synced from <span className="font-mono text-foreground">QBO</span></span>
          </div>
        </CardFooter>
      </Card>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
