/* global React, ReactDOM, useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor,
            Button, Input, Kbd, Badge, Card, CardHeader, CardTitle, CardContent, CardFooter,
            Tabs, TabsTrigger, Sidebar, Topbar, I, ClientPicker, CLIENTS, Sparkline, cn */

const { useState, useMemo, useEffect } = React;

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

const fmt = (n) => {
  if (n === 0) return "—";
  const abs = Math.abs(n);
  const s = abs.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return n < 0 ? `(${s})` : s;
};
const fmtPct = (n) => (n === null || isNaN(n)) ? "—" : `${(n * 100).toFixed(1)}%`;

/* =========================================================
   Page head
   ========================================================= */
function PageHead({ period, setPeriod, view, setView }) {
  return (
    <div className="flex items-end justify-between gap-6 mb-6 flex-wrap">
      <div>
        <h1 className="text-[28px] leading-9 font-semibold tracking-tight m-0 mb-1">
          Income statement trend analysis
        </h1>
        <div className="text-[15px] text-muted-foreground">
          Atlas Coffee Roasters · <span className="font-mono text-foreground font-medium">Jan 1, 2026 → Dec 31, 2026</span> · As of May 28
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsTrigger value="Monthly">Monthly</TabsTrigger>
          <TabsTrigger value="Quarterly">Quarterly</TabsTrigger>
          <TabsTrigger value="YTD">YTD</TabsTrigger>
        </Tabs>
        <Tabs value={view} onValueChange={setView}>
          <TabsTrigger value="Trend">Trend</TabsTrigger>
          <TabsTrigger value="Compact">Compact</TabsTrigger>
          <TabsTrigger value="Pct">% of income</TabsTrigger>
        </Tabs>
        <div className="flex items-center gap-2 h-8 px-3 rounded-md border border-border bg-card text-[13px] hover:border-border-strong transition-colors cursor-pointer">
          <span className="text-text-soft">{I.cal}</span>
          <span className="font-mono">01/01/26</span>
          <span className="text-text-soft">→</span>
          <span className="font-mono">12/31/26</span>
        </div>
        <Button><span className="text-text-soft">{I.refresh}</span>Refresh</Button>
        <Button><span className="text-text-soft">{I.download}</span>Export</Button>
        <Button variant="primary">{I.share}<span>Share</span></Button>
      </div>
    </div>
  );
}

/* =========================================================
   KPI tile
   ========================================================= */
function Kpi({ label, value, delta, deltaLabel, dir = "up", spark, sparkColor }) {
  return (
    <Card>
      <div className="p-5 relative overflow-hidden">
        <div className="text-[11px] font-medium uppercase tracking-wider text-text-soft mb-3">
          {label}
        </div>
        <div className="font-mono tnum text-[28px] leading-none font-medium tracking-tight mb-3">
          <span className="text-text-soft text-[0.7em] mr-1">$</span>{value}
        </div>
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <span className={cn("flex items-center font-mono tnum font-medium",
                              dir === "up" ? "text-positive" : "text-destructive")}>
            {dir === "up" ? I.arrowUp : I.arrowDown}
            <span className="ml-0.5">{delta}</span>
          </span>
          <span>vs {deltaLabel}</span>
        </div>
        {spark && (
          <div className="absolute right-4 top-4 opacity-70">
            <Sparkline values={spark} color={sparkColor} />
          </div>
        )}
      </div>
    </Card>
  );
}

/* =========================================================
   P&L Table
   ========================================================= */
function PLTable({ data }) {
  const current = data.currentMonth;
  const computed = useMemo(() => data.sections.map((sec) => {
    const totals = new Array(12).fill(0);
    sec.accounts.forEach(a => a.vals.forEach((v, i) => totals[i] += v));
    const ytd = totals.reduce((s, v) => s + v, 0);
    const accountYtds = sec.accounts.map(a => a.vals.reduce((s,v)=>s+v,0));
    return { ...sec, totals, ytd, accountYtds };
  }), [data]);

  const income = computed.find(s => s.id === "income");
  const cogs   = computed.find(s => s.id === "cogs");
  const opex   = computed.find(s => s.id === "opex");

  const grossByMonth = income.totals.map((v, i) => v - cogs.totals[i]);
  const netByMonth   = grossByMonth.map((v, i) => v - opex.totals[i]);
  const grossYtd = grossByMonth.reduce((s,v)=>s+v,0);
  const netYtd   = netByMonth.reduce((s,v)=>s+v,0);
  const incomeYtd = income.ytd;
  const pctOf = (n, base) => base ? n / base : 0;

  const numCell = (val, opts = {}, key) => {
    const { future, ytd: isYtd } = opts;
    const cls = ["num"];
    if (future) cls.push("future");
    if (val === 0) cls.push("zero");
    if (val < 0) cls.push("neg");
    if (isYtd) cls.push("ytd");
    return <td key={key} className={cls.join(" ")}>{fmt(val)}</td>;
  };

  const accountRows = (sec) => sec.accounts.map((a, idx) => {
    const ytd = sec.accountYtds[idx];
    return (
      <tr key={a.code} className="account-row">
        <td className="account-c">
          <span className="text-text-soft font-mono text-[11px] mr-2.5">{a.code}</span>
          {a.name}
        </td>
        {a.vals.map((v, i) => numCell(v, { future: i + 1 > current }, `m${i}`))}
        {numCell(ytd, { ytd: true }, "ytd")}
        <td className="pct">{fmtPct(pctOf(ytd, incomeYtd))}</td>
      </tr>
    );
  });

  return (
    <div className="overflow-auto">
    <table className="pl-table">
      <thead>
        <tr>
          <th className="account-h">Account</th>
          {MONTHS.map((m, i) => (
            <th key={m} className={cn("month-h", i + 1 === current && "is-current")} style={{ minWidth: 84 }}>
              {m} <span className="opacity-60">26</span>
            </th>
          ))}
          <th className="ytd-h" style={{ minWidth: 100 }}>YTD</th>
          <th className="pct-h">% Inc.</th>
        </tr>
      </thead>
      <tbody>
        {/* Income */}
        <tr className="section"><td className="account-c">Income</td>{Array.from({length:14}).map((_,i)=><td key={i}></td>)}</tr>
        {accountRows(income)}
        <tr className="subtotal">
          <td className="account-c">Total income</td>
          {income.totals.map((v, i) => numCell(v, { future: i + 1 > current }, `m${i}`))}
          {numCell(income.ytd, { ytd: true }, "ytd")}
          <td className="pct">100.0%</td>
        </tr>

        {/* COGS */}
        <tr className="section"><td className="account-c">Cost of goods sold</td>{Array.from({length:14}).map((_,i)=><td key={i}></td>)}</tr>
        {accountRows(cogs)}
        <tr className="subtotal">
          <td className="account-c">Total COGS</td>
          {cogs.totals.map((v, i) => numCell(v, { future: i + 1 > current }, `m${i}`))}
          {numCell(cogs.ytd, { ytd: true }, "ytd")}
          <td className="pct">{fmtPct(pctOf(cogs.ytd, incomeYtd))}</td>
        </tr>

        {/* Gross profit */}
        <tr className="gross">
          <td className="account-c">Gross profit</td>
          {grossByMonth.map((v, i) => {
            const cls = ["num"];
            if (i + 1 > current) cls.push("future");
            if (v < 0) cls.push("neg");
            return <td key={i} className={cls.join(" ")}>{fmt(v)}</td>;
          })}
          <td className="num ytd">{fmt(grossYtd)}</td>
          <td className="pct">{fmtPct(pctOf(grossYtd, incomeYtd))}</td>
        </tr>

        {/* Opex */}
        <tr className="section"><td className="account-c">Operating expenses</td>{Array.from({length:14}).map((_,i)=><td key={i}></td>)}</tr>
        {accountRows(opex)}
        <tr className="subtotal">
          <td className="account-c">Total operating expenses</td>
          {opex.totals.map((v, i) => numCell(v, { future: i + 1 > current }, `m${i}`))}
          {numCell(opex.ytd, { ytd: true }, "ytd")}
          <td className="pct">{fmtPct(pctOf(opex.ytd, incomeYtd))}</td>
        </tr>

        {/* Net income */}
        <tr className="total">
          <td className="account-c">Net income</td>
          {netByMonth.map((v, i) => {
            const cls = ["num"];
            if (i + 1 > current) cls.push("future");
            if (v < 0) cls.push("neg");
            return <td key={i} className={cls.join(" ")}>{fmt(v)}</td>;
          })}
          <td className="num ytd">{fmt(netYtd)}</td>
          <td className="pct">{fmtPct(pctOf(netYtd, incomeYtd))}</td>
        </tr>
      </tbody>
    </table>
    </div>
  );
}

/* =========================================================
   App
   ========================================================= */
function App() {
  const data = JSON.parse(document.getElementById("data-pl").textContent);
  const [period, setPeriod] = useState("Monthly");
  const [view,   setView]   = useState("Trend");

  // KPIs / summary
  const summary = useMemo(() => {
    const sum = (sec) => sec.accounts.reduce((tot, a) => tot + a.vals.reduce((s,v)=>s+v,0), 0);
    const inc  = data.sections.find(s => s.id === "income");
    const cogs = data.sections.find(s => s.id === "cogs");
    const opex = data.sections.find(s => s.id === "opex");
    const incYtd = sum(inc), cogsYtd = sum(cogs), opexYtd = sum(opex);
    const gross = incYtd - cogsYtd;
    const net = gross - opexYtd;

    const series = (sec) => {
      const out = new Array(12).fill(0);
      sec.accounts.forEach(a => a.vals.forEach((v, i) => out[i] += v));
      return out.slice(0, data.currentMonth);
    };
    const incS = series(inc);
    const expS = series(cogs).map((v, i) => v + series(opex)[i]);
    const grossS = incS.map((v, i) => v - series(cogs)[i]);
    const netS = incS.map((v, i) => v - expS[i]);

    return { incYtd, cogsYtd, opexYtd, gross, net, incS, expS, grossS, netS };
  }, [data]);

  return (
    <PageShell activeKey="pl" crumbs={["Reports", "Profit & Loss"]}>
      <PageHead period={period} setPeriod={setPeriod} view={view} setView={setView} />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Kpi label="Total income · YTD"
             value={Math.round(summary.incYtd).toLocaleString()}
             delta="+14.2%" deltaLabel="prior YTD" dir="up"
             spark={summary.incS} sparkColor="hsl(var(--positive))" />
        <Kpi label="Total expenses · YTD"
             value={Math.round(summary.cogsYtd + summary.opexYtd).toLocaleString()}
             delta="+8.6%" deltaLabel="prior YTD" dir="up"
             spark={summary.expS} sparkColor="hsl(var(--muted-foreground))" />
        <Kpi label="Gross profit · YTD"
             value={Math.round(summary.gross).toLocaleString()}
             delta="+19.4%" deltaLabel="prior YTD" dir="up"
             spark={summary.grossS} sparkColor="hsl(var(--primary))" />
        <Kpi label="Net income · YTD"
             value={Math.round(summary.net).toLocaleString()}
             delta="+22.1%" deltaLabel="prior YTD" dir="up"
             spark={summary.netS} sparkColor="hsl(var(--positive))" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle>Income statement · FY 2026</CardTitle>
            <span className="text-[13px] text-muted-foreground">12-month trend · accrual basis</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">{I.filter}<span>Filter</span></Button>
            <Button variant="ghost" size="sm">{I.print}<span>Print</span></Button>
            <Button variant="ghost" size="icon-sm">{I.more}</Button>
          </div>
        </CardHeader>

        <PLTable data={data} />

        <CardFooter>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-muted border border-border"></span>
                Projected / future month
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-accent"></span>
                Current period
              </span>
              <span className="flex items-center gap-1.5">
                <span className="font-mono text-destructive">(123)</span>
                Negative value
              </span>
            </div>
            <div>
              Last refreshed <span className="font-mono text-foreground">2 min ago</span> · 19 accounts · synced from <span className="font-mono text-foreground">QBO</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
