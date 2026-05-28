/* global React, ReactDOM, PageShell, StatTile, Button, Badge, Card, CardHeader, CardTitle,
            CardFooter, Tabs, TabsTrigger, cn, I */

const { useState } = React;

const PLANS = [
  {
    id: "solo",
    name: "Solo",
    price: 29,
    desc: "For a single business doing its own books.",
    features: [
      { ok: true,  t: "1 business · up to 250 transactions / month" },
      { ok: true,  t: "2 connected bank accounts" },
      { ok: true,  t: "Profit & Loss · Balance Sheet · GL" },
      { ok: true,  t: "Up to 1 user" },
      { ok: false, t: "Multi-client switching" },
      { ok: false, t: "Staff & role permissions" },
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 79,
    desc: "Most popular — adds payroll, AR/AP, and unlimited transactions.",
    badge: "Most popular",
    current: true,
    features: [
      { ok: true,  t: "Unlimited transactions" },
      { ok: true,  t: "Up to 10 connected accounts" },
      { ok: true,  t: "All reports + custom templates" },
      { ok: true,  t: "Up to 5 users + role-based access" },
      { ok: true,  t: "Period closing & locking" },
      { ok: false, t: "Multi-client switching" },
    ],
  },
  {
    id: "firm",
    name: "Firm",
    price: 199,
    perClient: 12,
    desc: "For bookkeepers and accountants managing many clients.",
    features: [
      { ok: true,  t: "Everything in Growth" },
      { ok: true,  t: "Multi-client switching with ⌘K palette" },
      { ok: true,  t: "Unlimited firm staff seats" },
      { ok: true,  t: "Approve workflow + audit log" },
      { ok: true,  t: "Per-client billing & engagement letters" },
      { ok: true,  t: "Priority support · dedicated CSM" },
    ],
  },
];

const ADDONS = [
  { name: "Receipt capture",   price: 9,  desc: "AI-powered receipt OCR · unlimited scans", active: true },
  { name: "Payroll add-on",    price: 49, desc: "Run payroll directly from Accounting Completed · Gusto integration", active: true },
  { name: "1099 e-filing",     price: 4,  unit: "/contractor", desc: "Generate, e-file, and mail 1099-NEC at year-end", active: false },
  { name: "Inventory tracking",price: 29, desc: "SKU-level inventory with COGS calculation", active: false },
];

const INVOICES = [
  { id: "INV-2026-0005", date: "May 01, 2026", amount: 137.00, status: "paid", method: "•••• 4242" },
  { id: "INV-2026-0004", date: "Apr 01, 2026", amount: 137.00, status: "paid", method: "•••• 4242" },
  { id: "INV-2026-0003", date: "Mar 01, 2026", amount: 137.00, status: "paid", method: "•••• 4242" },
  { id: "INV-2026-0002", date: "Feb 01, 2026", amount: 128.00, status: "paid", method: "•••• 4242" },
  { id: "INV-2026-0001", date: "Jan 01, 2026", amount: 128.00, status: "paid", method: "•••• 4242" },
];

function PlanCard({ p }) {
  return (
    <div className={cn(
      "relative flex flex-col rounded-lg border p-6 transition-all",
      p.current
        ? "border-primary bg-card shadow-elev-md ring-2 ring-accent"
        : p.badge
        ? "border-border bg-card shadow-elev-xs"
        : "border-border bg-card"
    )}>
      {p.badge && (
        <Badge variant="accent" className="absolute -top-2 left-6 h-5 text-[10.5px] px-2.5">{p.badge}</Badge>
      )}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[18px] font-semibold">{p.name}</h3>
        {p.current && <Badge variant="positive" dot>Current</Badge>}
      </div>
      <p className="text-[13px] text-muted-foreground mb-6" style={{ textWrap: "pretty" }}>{p.desc}</p>

      <div className="mb-5">
        <div className="flex items-baseline gap-1">
          <span className="text-[36px] font-semibold font-mono tnum">${p.price}</span>
          <span className="text-[13px] text-muted-foreground">/ mo</span>
        </div>
        {p.perClient && (
          <div className="text-[12px] text-muted-foreground mt-1">
            + <span className="font-mono">${p.perClient}</span> per active client
          </div>
        )}
      </div>

      <ul className="space-y-2 mb-6 flex-1">
        {p.features.map((f, i) => (
          <li key={i} className={cn("flex items-start gap-2 text-[12.5px]", !f.ok && "text-text-soft")}>
            <span className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", f.ok ? "text-positive" : "text-text-soft")}>
              {f.ok ? I.check : I.x}
            </span>
            <span>{f.t}</span>
          </li>
        ))}
      </ul>

      {p.current ? (
        <Button variant="outline" className="w-full justify-center">Manage plan</Button>
      ) : p.price > 79 ? (
        <Button variant="primary" className="w-full justify-center">Upgrade to {p.name}</Button>
      ) : (
        <Button className="w-full justify-center">Switch to {p.name}</Button>
      )}
    </div>
  );
}

function App() {
  const [billing, setBilling] = useState("Monthly");
  const usagePct = (used, max) => Math.min(100, (used / max) * 100);

  return (
    <PageShell activeKey="plans" crumbs={["Account", "Plans & billing"]}>
      <div className="flex items-end justify-between gap-6 mb-6 flex-wrap">
        <div>
          <h1 className="text-[28px] leading-9 font-semibold tracking-tight m-0 mb-1">Plans &amp; billing</h1>
          <p className="text-[15px] text-muted-foreground">
            On <span className="font-medium text-foreground">Growth</span> · next invoice <span className="font-mono text-foreground">June 1, 2026</span> · <span className="font-mono text-foreground">$137.00</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={billing} onValueChange={setBilling}>
            <TabsTrigger value="Monthly">Monthly</TabsTrigger>
            <TabsTrigger value="Annual">Annual · save 20%</TabsTrigger>
          </Tabs>
        </div>
      </div>

      {/* Current plan summary tiles */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatTile label="Current plan"   value="Growth"   sub="$79/mo + $9 add-ons" intent="accent" />
        <StatTile label="Next invoice"   value="$137.00"  sub="June 1, 2026" />
        <StatTile label="Trial status"   value="Active"   sub="42 days remaining" intent="positive" />
        <StatTile label="Annual savings" value="$331.20"  sub="if you switch to annual" intent="positive" />
      </div>

      {/* Plan tiers */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {PLANS.map(p => <PlanCard key={p.id} p={p} />)}
      </div>

      {/* Usage */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Usage this billing period</CardTitle>
          <span className="text-[12px] text-muted-foreground">May 1 → May 31, 2026</span>
        </CardHeader>
        <div className="grid grid-cols-3 gap-px bg-border/60">
          {[
            { label: "Transactions",       used: 1284, max: "∞",   sub: "unlimited on Growth", pct: 25 },
            { label: "Connected accounts", used: 5,    max: 10,    sub: "5 of 10 included" },
            { label: "Users with access",  used: 3,    max: 5,     sub: "3 of 5 included" },
          ].map((u, i) => {
            const pct = typeof u.pct === "number" ? u.pct : (u.used / u.max) * 100;
            return (
              <div key={i} className="bg-card p-5">
                <div className="text-[11px] uppercase tracking-wider text-text-soft font-medium mb-3">{u.label}</div>
                <div className="font-mono tnum text-[22px] font-medium mb-2">
                  {u.used.toLocaleString()}<span className="text-text-soft text-[16px]"> / {u.max}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-2">
                  <div className={cn("h-full rounded-full", pct > 90 ? "bg-warning" : "bg-primary")} style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[11.5px] text-muted-foreground">{u.sub}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Add-ons */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add-ons</CardTitle>
          <span className="text-[12px] text-muted-foreground">2 active · adds <span className="font-mono text-foreground">$58/mo</span></span>
        </CardHeader>
        <div className="divide-y divide-border/60">
          {ADDONS.map(a => (
            <div key={a.name} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{a.name}</span>
                  {a.active && <Badge variant="positive" dot>Active</Badge>}
                </div>
                <div className="text-[12.5px] text-muted-foreground mt-0.5">{a.desc}</div>
              </div>
              <div className="text-right">
                <div className="font-mono tnum font-semibold">${a.price}{a.unit || "/mo"}</div>
              </div>
              <Button size="sm" variant={a.active ? "ghost" : "outline"}>
                {a.active ? "Remove" : "Add"}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Payment method + invoice history */}
      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Card>
          <CardHeader><CardTitle>Payment method</CardTitle></CardHeader>
          <div className="p-5 space-y-3">
            <div className="border border-border rounded-lg p-4 bg-gradient-to-br from-[#1A1A2E] to-[#0F0F1A] text-white">
              <div className="flex items-start justify-between mb-8">
                <div className="text-[11px] uppercase tracking-wider opacity-70">Visa</div>
                <div className="font-mono text-[14px] opacity-50">{I.card}</div>
              </div>
              <div className="font-mono text-[18px] tracking-[0.2em] mb-3">•••• •••• •••• 4242</div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="opacity-70">Diego Marín</span>
                <span className="opacity-70 font-mono">EXP 09 / 28</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm">Update card</Button>
              <Button size="sm" variant="ghost">Add backup card</Button>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing address</CardTitle>
            <Button size="sm" variant="ghost">Edit</Button>
          </CardHeader>
          <div className="p-5 text-[13px]">
            <div className="font-medium mb-1">Atlas Coffee Roasters, LLC</div>
            <div className="text-muted-foreground">
              Attn: Diego Marín<br/>
              2280 Telegraph Ave<br/>
              Oakland, CA 94612<br/>
              United States
            </div>
            <div className="mt-4 pt-4 border-t border-border/60">
              <div className="text-[11px] uppercase tracking-wider text-text-soft font-medium mb-1">Tax ID</div>
              <div className="font-mono text-[13px]">EIN 84-1234567</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Invoice history */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Invoice history</CardTitle>
          <Button size="sm" variant="ghost">{I.download}<span>Download all</span></Button>
        </CardHeader>
        <table className="w-full text-[13.5px]">
          <thead className="bg-muted/60 border-b border-border/60">
            <tr>
              <th className="text-left px-5 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[180px]">Invoice</th>
              <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[140px]">Date</th>
              <th className="text-right px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[120px]">Amount</th>
              <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[100px]">Status</th>
              <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium">Payment</th>
              <th className="w-[120px]"></th>
            </tr>
          </thead>
          <tbody>
            {INVOICES.map(inv => (
              <tr key={inv.id} className="border-b border-border/60 last:border-b-0 hover:bg-muted/60 transition-colors group">
                <td className="px-5 align-middle font-mono text-[12px] text-primary group-hover:underline" style={{ height: 44 }}>{inv.id}</td>
                <td className="px-3 align-middle font-mono text-[12.5px] text-muted-foreground">{inv.date}</td>
                <td className="px-3 align-middle text-right font-mono tnum font-medium">${inv.amount.toFixed(2)}</td>
                <td className="px-3 align-middle"><Badge variant="positive" dot>Paid</Badge></td>
                <td className="px-3 align-middle font-mono text-[12.5px] text-muted-foreground">Visa {inv.method}</td>
                <td className="px-3 align-middle text-right">
                  <Button size="icon-sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">{I.download}</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <CardFooter>
          <div className="flex items-center justify-between w-full">
            <span>5 invoices · all paid on time</span>
            <a href="#" className="text-primary hover:underline">View 2025 history →</a>
          </div>
        </CardFooter>
      </Card>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
