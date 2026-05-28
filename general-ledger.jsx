/* global React, ReactDOM, PageShell, PageHeader, Button, Badge, Card, CardHeader, CardTitle,
            CardFooter, Tabs, TabsTrigger, cn, I */

const { useState, useMemo } = React;

/* ---------- Chart of accounts (flattened for left rail) ---------- */
const COA_GROUPS = [
  { type: "Assets", accounts: [
    { code: "1010", name: "Operating checking — Chase",   balance: 248124.18 },
    { code: "1020", name: "Business savings — Chase",     balance:  82410.00 },
    { code: "1030", name: "Stripe & Square in transit",   balance:  15332.10 },
    { code: "1200", name: "Accounts receivable",          balance:  48220.40 },
    { code: "1300", name: "Inventory — green coffee",     balance:  64820.00 },
    { code: "1320", name: "Inventory — packaging",        balance:  12480.00 },
    { code: "1400", name: "Prepaid expenses",             balance:   8420.00 },
    { code: "1500", name: "Roasting equipment",           balance: 184200.00 },
  ]},
  { type: "Liabilities", accounts: [
    { code: "2010", name: "Accounts payable",             balance:  38420.00 },
    { code: "2020", name: "Credit card — Amex",           balance:   4218.42 },
    { code: "2030", name: "Credit card — Chase",          balance:  12488.12 },
    { code: "2100", name: "Payroll liabilities",          balance:  18420.00 },
    { code: "2120", name: "Sales tax payable",            balance:   8420.00 },
  ]},
  { type: "Income", accounts: [
    { code: "4010", name: "Wholesale roasted coffee",     balance: 1014950 },
    { code: "4020", name: "Retail café sales",            balance: 767200 },
    { code: "4030", name: "Subscription box revenue",     balance: 258140 },
    { code: "4040", name: "Merchandise & retail goods",   balance:  67740 },
  ]},
  { type: "Expenses", accounts: [
    { code: "5010", name: "Green coffee purchases",       balance: 474650 },
    { code: "6010", name: "Salaries & wages",             balance: 403100 },
    { code: "6030", name: "Rent & occupancy",             balance:  74000 },
    { code: "6040", name: "Utilities",                    balance:  12930 },
    { code: "6050", name: "Marketing & advertising",      balance:  49600 },
    { code: "6060", name: "Software & subscriptions",     balance:  17200 },
    { code: "6070", name: "Insurance",                    balance:  12400 },
    { code: "6080", name: "Travel & entertainment",       balance:  10100 },
  ]},
];

/* ---------- Sample GL entries for the selected account (1010 Operating checking) ---------- */
const GL_ENTRIES = {
  "1010": {
    openingBalance: 188420.00,
    entries: [
      { date: "May 24", iso:"2026-05-24", ref:"DEP-2241", desc:"Square daily settlement",    memo:"Settlement batch 0524-A", debit: 6210.40,  credit: null,    type:"Deposit"  },
      { date: "May 24", iso:"2026-05-24", ref:"DEP-2240", desc:"Blue Bottle Coffee",         memo:"INV-2241 Wholesale",     debit:12480.00,  credit: null,    type:"Deposit"  },
      { date: "May 23", iso:"2026-05-23", ref:"ACH-8821", desc:"PG&E elec autopay",          memo:"May 2026",               debit: null,     credit:  842.18, type:"Bill pay" },
      { date: "May 23", iso:"2026-05-23", ref:"DEP-2239", desc:"Stripe transfer",            memo:"Stripe payout 0523",     debit: 3284.10,  credit: null,    type:"Deposit"  },
      { date: "May 22", iso:"2026-05-22", ref:"CHK-2284", desc:"Roastery Lease LLC",         memo:"May rent",               debit: null,     credit:14800.00, type:"Check"    },
      { date: "May 22", iso:"2026-05-22", ref:"ACH-8820", desc:"Cafe Imports LLC",           memo:"PO 8814 Ethiopian Yirg.",debit: null,     credit: 8940.00, type:"Bill pay" },
      { date: "May 21", iso:"2026-05-21", ref:"ACH-8819", desc:"Gusto payroll",              memo:"Bi-weekly",              debit: null,     credit:38420.18, type:"Payroll"  },
      { date: "May 20", iso:"2026-05-20", ref:"DEP-2238", desc:"Square daily settlement",    memo:"Settlement batch 0520-A",debit: 5840.10,  credit: null,    type:"Deposit"  },
      { date: "May 19", iso:"2026-05-19", ref:"ACH-8818", desc:"State Farm Ins",             memo:"Monthly premium",        debit: null,     credit: 2480.00, type:"Bill pay" },
      { date: "May 19", iso:"2026-05-19", ref:"CHK-2283", desc:"Upwork Escrow",              memo:"Designer May",           debit: null,     credit: 2400.00, type:"Check"    },
      { date: "May 17", iso:"2026-05-17", ref:"DEP-2237", desc:"Wire — Lighthouse Roasters", memo:"INV-2238",               debit:24820.00,  credit: null,    type:"Wire"     },
      { date: "May 16", iso:"2026-05-16", ref:"ACH-8817", desc:"Amazon Marketplace",         memo:"Office supplies",        debit: null,     credit:  284.32, type:"Bill pay" },
      { date: "May 15", iso:"2026-05-15", ref:"DEP-2236", desc:"Stripe transfer",            memo:"Stripe payout 0515",     debit: 4820.50,  credit: null,    type:"Deposit"  },
      { date: "May 14", iso:"2026-05-14", ref:"ACH-8816", desc:"AT&T Business",              memo:"Phone + internet",       debit: null,     credit:  428.10, type:"Bill pay" },
      { date: "May 13", iso:"2026-05-13", ref:"DEP-2235", desc:"Square daily settlement",    memo:"Settlement batch 0513-A",debit: 5240.80,  credit: null,    type:"Deposit"  },
      { date: "May 10", iso:"2026-05-10", ref:"DEP-2234", desc:"Blue Bottle Coffee",         memo:"INV-2228",               debit:11820.00,  credit: null,    type:"Deposit"  },
      { date: "May 08", iso:"2026-05-08", ref:"ACH-8815", desc:"Gusto payroll",              memo:"Bi-weekly",              debit: null,     credit:38420.18, type:"Payroll"  },
    ],
  },
};

const fmtN = (n) => {
  if (n === null || n === undefined) return "";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const fmtMoney = (n) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ---------- App ---------- */
function App() {
  const [sel, setSel] = useState("1010");
  const [q, setQ] = useState("");
  const [period, setPeriod] = useState("This month");

  const flat = useMemo(() => COA_GROUPS.flatMap(g => g.accounts.map(a => ({ ...a, type: g.type }))), []);
  const selected = flat.find(a => a.code === sel) || flat[0];

  const filteredAccounts = useMemo(() => {
    if (!q) return COA_GROUPS;
    const n = q.toLowerCase();
    return COA_GROUPS.map(g => ({
      ...g,
      accounts: g.accounts.filter(a => a.code.includes(q) || a.name.toLowerCase().includes(n)),
    })).filter(g => g.accounts.length > 0);
  }, [q]);

  const data = GL_ENTRIES[sel];
  const entries = data?.entries || [];
  const opening = data?.openingBalance || 0;

  // Compute running balance (newest entries listed first; running balance shown chronologically)
  const enriched = useMemo(() => {
    const reversed = [...entries].reverse(); // oldest first for running calc
    let running = opening;
    const enrichedAsc = reversed.map(e => {
      const delta = (e.debit || 0) - (e.credit || 0);
      running += delta;
      return { ...e, running };
    });
    return enrichedAsc.reverse(); // back to newest first
  }, [sel]);

  const totalDebit  = entries.reduce((s, e) => s + (e.debit  || 0), 0);
  const totalCredit = entries.reduce((s, e) => s + (e.credit || 0), 0);
  const closingBal  = opening + totalDebit - totalCredit;

  return (
    <PageShell activeKey="ledger" crumbs={["Reports", "General Ledger"]} mainClassName="p-0">
      <div className="grid h-full" style={{ gridTemplateColumns: "300px 1fr" }}>

        {/* ---------- Left rail: account picker ---------- */}
        <aside className="border-r border-border bg-card flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border/60">
            <div className="text-[11px] uppercase tracking-wider text-text-soft font-medium mb-2">Account</div>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-soft">{I.search}</span>
              <input value={q} onChange={(e) => setQ(e.target.value)}
                     placeholder="Search accounts…"
                     className="w-full h-8 pl-8 pr-3 rounded-md bg-muted border border-border text-[13px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/30" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {filteredAccounts.map(group => (
              <div key={group.type} className="mb-2">
                <div className="px-4 py-2 text-[10.5px] uppercase tracking-wider text-text-soft font-medium">
                  {group.type}
                </div>
                {group.accounts.map(a => (
                  <button key={a.code} onClick={() => setSel(a.code)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-1.5 text-left transition-colors",
                            a.code === sel ? "bg-accent" : "hover:bg-muted/60"
                          )}>
                    <span className={cn("font-mono text-[11px] w-10 flex-shrink-0",
                                          a.code === sel ? "text-primary" : "text-text-soft")}>{a.code}</span>
                    <span className={cn("flex-1 truncate text-[13px]",
                                          a.code === sel ? "text-primary font-medium" : "text-foreground")}>
                      {a.name}
                    </span>
                    <span className={cn("font-mono tnum text-[11.5px]",
                                          a.code === sel ? "text-primary" : "text-text-soft")}>
                      ${a.balance.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>

        {/* ---------- Right main ---------- */}
        <section className="overflow-auto p-6 md:p-8">
          <PageHeader
            title="General Ledger"
            sub={
              <>
                <span className="font-mono text-foreground font-medium">{selected.code}</span>{" "}
                {selected.name} · <span className="font-mono">{selected.type}</span> account
              </>
            }
            actions={
              <>
                <Tabs value={period} onValueChange={setPeriod}>
                  <TabsTrigger value="This month">This month</TabsTrigger>
                  <TabsTrigger value="MTD">MTD</TabsTrigger>
                  <TabsTrigger value="QTD">QTD</TabsTrigger>
                  <TabsTrigger value="YTD">YTD</TabsTrigger>
                </Tabs>
                <Button>{I.download}<span>Export</span></Button>
                <Button>{I.print}<span>Print</span></Button>
              </>
            }
          />

          {/* Summary row */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="text-[11px] uppercase tracking-wider text-text-soft font-medium mb-2">Opening balance</div>
              <div className="font-mono tnum text-[20px] font-medium">{fmtMoney(opening)}</div>
              <div className="text-[12px] text-text-soft mt-1">as of May 01</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="text-[11px] uppercase tracking-wider text-text-soft font-medium mb-2">Debits</div>
              <div className="font-mono tnum text-[20px] font-medium text-positive">{fmtMoney(totalDebit)}</div>
              <div className="text-[12px] text-text-soft mt-1">{entries.filter(e => e.debit).length} entries</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="text-[11px] uppercase tracking-wider text-text-soft font-medium mb-2">Credits</div>
              <div className="font-mono tnum text-[20px] font-medium text-destructive">{fmtMoney(totalCredit)}</div>
              <div className="text-[12px] text-text-soft mt-1">{entries.filter(e => e.credit).length} entries</div>
            </div>
            <div className="bg-card border border-primary/30 rounded-lg p-5 ring-2 ring-accent">
              <div className="text-[11px] uppercase tracking-wider text-primary font-medium mb-2">Closing balance</div>
              <div className="font-mono tnum text-[20px] font-semibold text-primary">{fmtMoney(closingBal)}</div>
              <div className="text-[12px] text-primary/70 mt-1">as of today</div>
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[280px] max-w-md">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-soft">{I.search}</span>
              <input placeholder="Search descriptions, memos, references…"
                     className="w-full h-8 pl-8 pr-3 rounded-md bg-card border border-border text-[13.5px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/30" />
            </div>
            <Button size="sm" variant="outline">{I.cal}<span>May 1 → May 28</span></Button>
            <Button size="sm" variant="outline">All transaction types</Button>
            <Button size="sm" variant="outline">{I.filter}<span>More filters</span></Button>
          </div>

          {/* Entries table */}
          <Card>
            <table className="w-full text-[13.5px]">
              <thead className="bg-muted/60 border-b border-border">
                <tr>
                  <th className="text-left px-4 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[80px]">Date</th>
                  <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[110px]">Type</th>
                  <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[100px]">Reference</th>
                  <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium">Description</th>
                  <th className="text-right px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[120px]">Debit</th>
                  <th className="text-right px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[120px]">Credit</th>
                  <th className="text-right px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[140px] bg-secondary border-l border-border">Running</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border bg-muted/40">
                  <td colSpan={6} className="px-4 h-9 text-[11.5px] uppercase tracking-wider text-text-soft font-medium">
                    Opening balance — May 01, 2026
                  </td>
                  <td className="px-3 text-right font-mono tnum font-medium text-text-soft bg-muted/40 border-l border-border/60">
                    {fmtMoney(opening)}
                  </td>
                </tr>
                {enriched.map((e, i) => (
                  <tr key={i} className="border-b border-border/60 hover:bg-muted/60 transition-colors group cursor-pointer">
                    <td className="px-4 align-middle font-mono text-[12.5px] text-muted-foreground" style={{ height: "var(--row-h, 38px)" }}>{e.date}</td>
                    <td className="px-3 align-middle">
                      <span className="text-[11.5px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{e.type}</span>
                    </td>
                    <td className="px-3 align-middle font-mono text-[12px] text-primary group-hover:underline">{e.ref}</td>
                    <td className="px-3 align-middle">
                      <div className="font-medium">{e.desc}</div>
                      {e.memo && <div className="text-[11.5px] text-text-soft">{e.memo}</div>}
                    </td>
                    <td className="px-3 align-middle text-right font-mono tnum text-positive">{e.debit ? fmtN(e.debit) : <span className="text-text-soft">—</span>}</td>
                    <td className="px-3 align-middle text-right font-mono tnum text-destructive">{e.credit ? fmtN(e.credit) : <span className="text-text-soft">—</span>}</td>
                    <td className="px-3 align-middle text-right font-mono tnum text-foreground bg-secondary/40 border-l border-border/60">{fmtN(e.running)}</td>
                  </tr>
                ))}
                <tr className="bg-accent/30 border-t-2 border-primary/30">
                  <td colSpan={4} className="px-4 h-10 font-semibold">Totals</td>
                  <td className="px-3 text-right font-mono tnum font-semibold text-positive">{fmtN(totalDebit)}</td>
                  <td className="px-3 text-right font-mono tnum font-semibold text-destructive">{fmtN(totalCredit)}</td>
                  <td className="px-3 text-right font-mono tnum font-semibold text-primary bg-accent border-l border-border/60" style={{ borderBottom: "3px double hsl(var(--primary) / 0.3)" }}>
                    {fmtMoney(closingBal)}
                  </td>
                </tr>
              </tbody>
            </table>

            <CardFooter>
              <div className="flex items-center justify-between w-full">
                <span>Showing <span className="font-mono text-foreground">{entries.length}</span> entries · period <span className="font-mono text-foreground">May 1 → May 28, 2026</span></span>
                <span>Last refresh <span className="font-mono text-foreground">2 min ago</span></span>
              </div>
            </CardFooter>
          </Card>
        </section>
      </div>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
