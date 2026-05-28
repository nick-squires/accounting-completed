/* global React, ReactDOM, PageShell, PageHeader, Button, Badge, Card, CardHeader, CardTitle,
            CardFooter, Tabs, TabsTrigger, cn, I */

const { useState, useMemo } = React;

/* Account tree. Sub-accounts use the `parent` property. */
const ACCOUNTS = [
  // ASSETS
  { code: "1000", name: "Cash & cash equivalents",   type: "Asset",     detail: "Header",          balance: 345_866.28, ytd:  62_440.18, status: "active" },
  { code: "1010", name: "Operating checking — Chase",type: "Asset",     detail: "Bank — Checking", balance: 248_124.18, ytd:  60_400.40, status: "active", parent: "1000", connected: "Chase" },
  { code: "1020", name: "Business savings — Chase",  type: "Asset",     detail: "Bank — Savings",  balance:  82_410.00, ytd:  24_000.00, status: "active", parent: "1000", connected: "Chase" },
  { code: "1030", name: "Stripe + Square in transit",type: "Asset",     detail: "Bank — Other",    balance:  15_332.10, ytd:   5_912.10, status: "active", parent: "1000", connected: "Stripe, Square" },
  { code: "1200", name: "Accounts receivable",       type: "Asset",     detail: "A/R",             balance:  48_220.40, ytd:   6_940.40, status: "active" },
  { code: "1300", name: "Inventory",                 type: "Asset",     detail: "Header",          balance:  77_300.00, ytd:  16_250.00, status: "active" },
  { code: "1300.1",name:"Green coffee — unroasted",  type: "Asset",     detail: "Inventory",       balance:  64_820.00, ytd:  12_010.00, status: "active", parent: "1300" },
  { code: "1320", name: "Packaging & supplies",      type: "Asset",     detail: "Inventory",       balance:  12_480.00, ytd:   4_240.00, status: "active", parent: "1300" },
  { code: "1400", name: "Prepaid expenses",          type: "Asset",     detail: "Other current",   balance:   8_420.00, ytd:  -6_000.00, status: "active" },
  { code: "1500", name: "Fixed assets",              type: "Asset",     detail: "Header",          balance: 267_230.00, ytd: -20_000.00, status: "active" },
  { code: "1500.1",name:"Roasting equipment",        type: "Asset",     detail: "Equipment",       balance: 184_200.00, ytd:       0,    status: "active", parent: "1500" },
  { code: "1510", name: "Café build-out",            type: "Asset",     detail: "Leasehold imp.",  balance:  92_840.00, ytd:       0,    status: "active", parent: "1500" },
  { code: "1520", name: "Vehicles",                  type: "Asset",     detail: "Vehicles",        balance:  38_400.00, ytd:       0,    status: "active", parent: "1500" },
  { code: "1590", name: "Accumulated depreciation",  type: "Asset",     detail: "Contra",          balance: -48_210.00, ytd: -20_000.00, status: "active", parent: "1500" },

  // LIABILITIES
  { code: "2010", name: "Accounts payable",          type: "Liability", detail: "A/P",             balance:  38_420.00, ytd:   5_940.00, status: "active" },
  { code: "2020", name: "Credit card — Amex ·1124",  type: "Liability", detail: "Credit card",     balance:   4_218.42, ytd:   1_378.42, status: "active", connected: "Amex" },
  { code: "2030", name: "Credit card — Chase ·9921", type: "Liability", detail: "Credit card",     balance:  12_488.12, ytd:   3_068.12, status: "active", connected: "Chase" },
  { code: "2100", name: "Payroll liabilities",       type: "Liability", detail: "Payroll",         balance:  18_420.00, ytd:   2_000.00, status: "active" },
  { code: "2120", name: "Sales tax payable",         type: "Liability", detail: "Tax",             balance:   8_420.00, ytd:   1_000.00, status: "active" },
  { code: "2500", name: "Equipment loan — Chase",    type: "Liability", detail: "Long-term loan",  balance:  72_400.00, ytd: -12_200.00, status: "active" },

  // EQUITY
  { code: "3010", name: "Owner's equity",            type: "Equity",    detail: "Equity",          balance: 180_000.00, ytd:  25_000.00, status: "active" },
  { code: "3020", name: "Retained earnings",         type: "Equity",    detail: "Retained",        balance: 248_420.00, ytd:       0,    status: "active" },

  // INCOME
  { code: "4000", name: "Operating revenue",         type: "Income",    detail: "Header",          balance: 2_108_030,  ytd: 2_108_030, status: "active" },
  { code: "4010", name: "Wholesale roasted coffee",  type: "Income",    detail: "Sales",           balance: 1_014_950,  ytd: 1_014_950, status: "active", parent: "4000" },
  { code: "4020", name: "Retail café sales",         type: "Income",    detail: "Sales",           balance:   767_200,  ytd:   767_200, status: "active", parent: "4000" },
  { code: "4030", name: "Subscription box revenue",  type: "Income",    detail: "Sales",           balance:   258_140,  ytd:   258_140, status: "active", parent: "4000" },
  { code: "4040", name: "Merchandise & retail goods",type: "Income",    detail: "Sales",           balance:    67_740,  ytd:    67_740, status: "active", parent: "4000" },

  // EXPENSES
  { code: "5000", name: "Cost of goods sold",        type: "Expense",   detail: "Header",          balance:   626_220,  ytd:   626_220, status: "active" },
  { code: "5010", name: "Green coffee purchases",    type: "Expense",   detail: "COGS",            balance:   474_650,  ytd:   474_650, status: "active", parent: "5000" },
  { code: "5020", name: "Roasting labor",            type: "Expense",   detail: "COGS",            balance:   127_900,  ytd:   127_900, status: "active", parent: "5000" },
  { code: "5030", name: "Packaging & supplies",      type: "Expense",   detail: "COGS",            balance:    60_180,  ytd:    60_180, status: "active", parent: "5000" },
  { code: "6010", name: "Salaries & wages",          type: "Expense",   detail: "Payroll",         balance:   403_100,  ytd:   403_100, status: "active" },
  { code: "6020", name: "Payroll taxes & benefits",  type: "Expense",   detail: "Payroll",         balance:    94_800,  ytd:    94_800, status: "active" },
  { code: "6030", name: "Rent & occupancy",          type: "Expense",   detail: "Occupancy",       balance:    74_000,  ytd:    74_000, status: "active" },
  { code: "6040", name: "Utilities",                 type: "Expense",   detail: "Occupancy",       balance:    12_930,  ytd:    12_930, status: "active" },
  { code: "6050", name: "Marketing & advertising",   type: "Expense",   detail: "Marketing",       balance:    49_600,  ytd:    49_600, status: "active" },
  { code: "6060", name: "Software & subscriptions",  type: "Expense",   detail: "Software",        balance:    17_200,  ytd:    17_200, status: "active" },
  { code: "6070", name: "Insurance",                 type: "Expense",   detail: "Other",           balance:    12_400,  ytd:    12_400, status: "active" },
  { code: "6080", name: "Travel & entertainment",    type: "Expense",   detail: "Other",           balance:    10_100,  ytd:    10_100, status: "active" },
  { code: "9000", name: "Other expense — bad debt",  type: "Expense",   detail: "Other",           balance:         0,  ytd:         0, status: "inactive" },
];

const TYPE_TINT = {
  Asset:     { dot: "bg-info",     text: "text-info" },
  Liability: { dot: "bg-warning",  text: "text-warning" },
  Equity:    { dot: "bg-[hsl(256_49%_47%)]", text: "text-[hsl(256_49%_47%)]" },
  Income:    { dot: "bg-positive", text: "text-positive" },
  Expense:   { dot: "bg-destructive", text: "text-destructive" },
};

const fmt = (n, fr = 0) => n.toLocaleString("en-US", { minimumFractionDigits: fr, maximumFractionDigits: fr });
const fmtBal = (n) => (n < 0 ? "(" + fmt(Math.abs(n), 0) + ")" : fmt(n, 0));
const fmtDelta = (n) => {
  if (n === 0) return "—";
  const s = (n > 0 ? "+" : "−") + "$" + fmt(Math.abs(n));
  return s;
};

/* ---------- App ---------- */
function App() {
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const filtered = useMemo(() => {
    return ACCOUNTS.filter(a => {
      if (tab !== "all" && a.type !== tab) return false;
      if (!showInactive && a.status === "inactive") return false;
      if (q) {
        const n = q.toLowerCase();
        return a.code.includes(q) || a.name.toLowerCase().includes(n) || a.detail.toLowerCase().includes(n);
      }
      return true;
    });
  }, [tab, q, showInactive]);

  const counts = useMemo(() => ({
    all: ACCOUNTS.filter(a => showInactive || a.status === "active").length,
    Asset:     ACCOUNTS.filter(a => a.type === "Asset"     && (showInactive || a.status === "active")).length,
    Liability: ACCOUNTS.filter(a => a.type === "Liability" && (showInactive || a.status === "active")).length,
    Equity:    ACCOUNTS.filter(a => a.type === "Equity"    && (showInactive || a.status === "active")).length,
    Income:    ACCOUNTS.filter(a => a.type === "Income"    && (showInactive || a.status === "active")).length,
    Expense:   ACCOUNTS.filter(a => a.type === "Expense"   && (showInactive || a.status === "active")).length,
  }), [showInactive]);

  return (
    <PageShell activeKey="coa" crumbs={["Setup", "Chart of accounts"]}>
      <PageHeader
        title="Chart of accounts"
        sub={<>Atlas Coffee Roasters · <span className="font-mono text-foreground font-medium">{counts.all}</span> accounts · last modified <span className="font-mono">2026-05-22</span></>}
        actions={
          <>
            <Button>{I.download}<span>Export</span></Button>
            <Button>Import CSV</Button>
            <Button variant="primary">{I.plus}<span>New account</span></Button>
          </>
        }
      />

      {/* Tabs */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsTrigger value="all">All <span className="ml-1 font-mono tnum opacity-60">{counts.all}</span></TabsTrigger>
          <TabsTrigger value="Asset">Assets <span className="ml-1 font-mono tnum opacity-60">{counts.Asset}</span></TabsTrigger>
          <TabsTrigger value="Liability">Liabilities <span className="ml-1 font-mono tnum opacity-60">{counts.Liability}</span></TabsTrigger>
          <TabsTrigger value="Equity">Equity <span className="ml-1 font-mono tnum opacity-60">{counts.Equity}</span></TabsTrigger>
          <TabsTrigger value="Income">Income <span className="ml-1 font-mono tnum opacity-60">{counts.Income}</span></TabsTrigger>
          <TabsTrigger value="Expense">Expenses <span className="ml-1 font-mono tnum opacity-60">{counts.Expense}</span></TabsTrigger>
        </Tabs>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-[12.5px] text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={showInactive} onChange={() => setShowInactive(v => !v)}
                   className="w-3.5 h-3.5 rounded-sm accent-primary cursor-pointer" />
            Show inactive
          </label>
          <div className="relative w-[260px]">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-soft">{I.search}</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search code or name…"
                   className="w-full h-8 pl-8 pr-3 rounded-md bg-card border border-border text-[13.5px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/30" />
          </div>
        </div>
      </div>

      {/* Table */}
      <Card>
        <table className="w-full text-[13.5px]">
          <thead className="bg-muted/60 border-b border-border">
            <tr>
              <th className="text-left px-4 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[90px]">Code</th>
              <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium">Account name</th>
              <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[130px]">Type</th>
              <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[150px]">Detail type</th>
              <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[140px]">Connected</th>
              <th className="text-right px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[140px]">Current balance</th>
              <th className="text-right px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[120px]">YTD change</th>
              <th className="w-[60px]"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-10 text-center text-muted-foreground">
                  <div className="text-foreground font-medium mb-1">No accounts match</div>
                  <div className="text-[13px]">Try a different filter, or <button onClick={() => { setQ(""); setTab("all"); }} className="text-primary hover:underline">clear all</button>.</div>
                </td>
              </tr>
            ) : filtered.map(a => {
              const indent = a.parent ? 24 : 0;
              const tint = TYPE_TINT[a.type];
              const isHeader = a.detail === "Header";
              const isInactive = a.status === "inactive";
              return (
                <tr key={a.code}
                    className={cn("border-b border-border/60 transition-colors group cursor-pointer",
                                    isHeader ? "bg-muted/40 hover:bg-muted/60" : "hover:bg-muted/60",
                                    isInactive && "opacity-50")}
                    style={{ height: "var(--row-h, 40px)" }}>
                  <td className="px-4 align-middle font-mono text-[12px] text-muted-foreground">{a.code}</td>
                  <td className="px-3 align-middle">
                    <div className="flex items-center" style={{ paddingLeft: indent }}>
                      {a.parent && (
                        <span className="text-border-strong mr-2 font-mono text-[14px] leading-none -mt-0.5">└</span>
                      )}
                      <span className={cn(isHeader ? "font-semibold" : "font-medium", "truncate")}>
                        {a.name}
                      </span>
                      {isInactive && <Badge variant="default" className="ml-2 text-[10px] h-5 px-2">Inactive</Badge>}
                    </div>
                  </td>
                  <td className="px-3 align-middle">
                    <span className={cn("inline-flex items-center gap-1.5 text-[12px] font-medium", tint.text)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", tint.dot)}></span>
                      {a.type}
                    </span>
                  </td>
                  <td className="px-3 align-middle text-[12.5px] text-muted-foreground">{a.detail}</td>
                  <td className="px-3 align-middle">
                    {a.connected ? (
                      <span className="inline-flex items-center gap-1.5 text-[11.5px] text-info">
                        <span className="w-3 h-3">{I.link}</span>
                        {a.connected}
                      </span>
                    ) : <span className="text-text-soft text-[11.5px]">—</span>}
                  </td>
                  <td className={cn("px-3 align-middle text-right font-mono tnum",
                                       isHeader ? "font-semibold" : "",
                                       a.balance < 0 ? "text-destructive" : "")}>
                    {fmtBal(a.balance)}
                  </td>
                  <td className={cn("px-3 align-middle text-right font-mono tnum text-[12px]",
                                       a.ytd > 0 ? "text-positive" : a.ytd < 0 ? "text-destructive" : "text-text-soft")}>
                    {fmtDelta(a.ytd)}
                  </td>
                  <td className="px-3 align-middle">
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
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
            <span>Showing <span className="font-mono text-foreground">{filtered.length}</span> of <span className="font-mono text-foreground">{counts.all}</span> accounts</span>
            <span className="flex items-center gap-2">
              <span>Bulk actions:</span>
              <button className="text-primary hover:underline">Recategorize</button>
              <span>·</span>
              <button className="text-primary hover:underline">Set tax mapping</button>
              <span>·</span>
              <button className="text-primary hover:underline">Mark inactive</button>
            </span>
          </div>
        </CardFooter>
      </Card>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
