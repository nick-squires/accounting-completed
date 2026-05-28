/* global React, ReactDOM, Button, Input, Kbd, Badge, Card, CardHeader, CardTitle, CardDescription,
            CardContent, CardFooter, Separator, Avatar, AvatarRound, Tabs, TabsTrigger,
            Sparkline, cn, I */

const { useState } = React;

/* Helpers ----------------------------------------------------------- */
function Section({ no, title, sub, children }) {
  return (
    <section className="mb-20">
      <div className="flex items-baseline justify-between gap-4 mb-6 pb-3 border-b border-border">
        <div>
          <h2 className="text-[22px] leading-7 font-semibold tracking-tight m-0">{title}</h2>
          {sub && <p className="text-muted-foreground mt-1 max-w-[60ch] m-0" style={{ textWrap: "pretty" }}>{sub}</p>}
        </div>
        <span className="font-mono text-[12px] text-text-soft whitespace-nowrap">{no}</span>
      </div>
      {children}
    </section>
  );
}
function Block({ title, children }) {
  return (
    <div className="mb-8">
      <h3 className="text-[11px] uppercase tracking-wider text-text-soft font-medium mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Swatch({ name, token, hex, bg }) {
  return (
    <div className="bg-card border border-border rounded-lg shadow-elev-xs overflow-hidden">
      <div className="h-[76px] border-b border-border/60" style={{ background: bg }} />
      <div className="p-3 flex flex-col gap-0.5">
        <div className="text-[12px] font-medium">{name}</div>
        <div className="font-mono text-[10.5px] text-text-soft">{token}</div>
        <div className="font-mono text-[10.5px] text-text-soft">{hex}</div>
      </div>
    </div>
  );
}

function TypeRow({ name, token, sample, props, sampleStyle = {} }) {
  return (
    <div className="grid items-end gap-6 pb-4 border-b border-border/60"
         style={{ gridTemplateColumns: "200px 1fr 200px" }}>
      <div>
        <div className="font-medium text-[13px]">{name}</div>
        <div className="font-mono text-[11px] text-text-soft">{token}</div>
      </div>
      <div style={{ textWrap: "balance", ...sampleStyle }}>{sample}</div>
      <div className="font-mono text-[11px] text-text-soft text-right">{props}</div>
    </div>
  );
}

/* App --------------------------------------------------------------- */
function DS() {
  const [tab, setTab] = useState("Overview");

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-16">

      {/* Header */}
      <header className="flex items-start justify-between gap-8 mb-16">
        <div className="max-w-[720px]">
          <div className="inline-flex items-center gap-2 mb-4 bg-accent text-accent-foreground px-2.5 py-1 rounded-full
                          text-[11px] font-medium uppercase tracking-wider">
            <span className="w-5 h-5 rounded-sm bg-primary text-primary-foreground grid place-items-center font-mono text-[8.5px] font-semibold tracking-tight">AC</span>
            <span>Accounting Completed Design System · v1.0</span>
          </div>
          <h1 className="text-[40px] leading-[1.1] font-semibold tracking-tight m-0 mb-3" style={{ textWrap: "balance" }}>
            A calm, data-forward system for cloud accounting.
          </h1>
          <p className="text-[18px] leading-7 text-muted-foreground m-0" style={{ textWrap: "pretty" }}>
            Tokens, components, and patterns built for accountants and the business owners they
            serve — quiet surfaces that get out of the way of ledgers, totals, and trend lines.
          </p>
        </div>
        <div className="flex flex-col gap-1 items-end text-[12px] text-text-soft">
          <span>Updated <span className="font-mono text-foreground">2026-05-28</span></span>
          <span>Stack <span className="font-mono text-foreground">Tailwind + shadcn-style</span></span>
          <span>Owner <span className="font-mono text-foreground">Design @ AC</span></span>
          <a href="Profit %26 Loss.html" className="inline-flex items-center gap-2 text-primary font-medium hover:underline mt-2">Open P&amp;L example →</a>
          <a href="Clients.html" className="inline-flex items-center gap-2 text-primary font-medium hover:underline">Open Clients example →</a>
        </div>
      </header>

      {/* ============================================================
          01 · Color
          ============================================================ */}
      <Section no="01 / Tokens" title="Color"
               sub="Cool, near-neutral surfaces let financial data sit at the front. One deep teal-blue accent — evolved from the heritage blue palette — carries primary action and state.">
        <Block title="Surface & neutrals">
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
            <Swatch name="Background"    token="--background"     hex="hsl(214 20% 97%)" bg="hsl(214 20% 97%)" />
            <Swatch name="Card / Surface" token="--card"          hex="hsl(0 0% 100%)"   bg="hsl(0 0% 100%)" />
            <Swatch name="Muted"         token="--muted"          hex="hsl(216 17% 98%)" bg="hsl(216 17% 98%)" />
            <Swatch name="Secondary"     token="--secondary"      hex="hsl(213 18% 95%)" bg="hsl(213 18% 95%)" />
            <Swatch name="Border"        token="--border"         hex="hsl(220 15% 91%)" bg="hsl(220 15% 91%)" />
            <Swatch name="Border strong" token="--border-strong"  hex="hsl(217 13% 84%)" bg="hsl(217 13% 84%)" />
          </div>
        </Block>

        <Block title="Text">
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
            <Swatch name="Foreground"        token="--foreground"        hex="hsl(217 43% 10%)" bg="hsl(217 43% 10%)" />
            <Swatch name="Muted foreground"  token="--muted-foreground"  hex="hsl(215 15% 42%)" bg="hsl(215 15% 42%)" />
            <Swatch name="Text soft"         token="--text-soft"         hex="hsl(215 12% 59%)" bg="hsl(215 12% 59%)" />
          </div>
        </Block>

        <Block title="Primary & state">
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
            <Swatch name="Primary"     token="--primary"     hex="hsl(202 85% 30%)" bg="hsl(202 85% 30%)" />
            <Swatch name="Accent"      token="--accent"      hex="hsl(207 67% 93%)" bg="hsl(207 67% 93%)" />
            <Swatch name="Positive"    token="--positive"    hex="hsl(151 76% 27%)" bg="hsl(151 76% 27%)" />
            <Swatch name="Destructive" token="--destructive" hex="hsl(9 69% 42%)"   bg="hsl(9 69% 42%)" />
            <Swatch name="Warning"     token="--warning"     hex="hsl(35 93% 36%)"  bg="hsl(35 93% 36%)" />
            <Swatch name="Info"        token="--info"        hex="hsl(216 74% 43%)" bg="hsl(216 74% 43%)" />
          </div>
        </Block>
      </Section>

      {/* ============================================================
          02 · Typography
          ============================================================ */}
      <Section no="02 / Tokens" title="Typography"
               sub="IBM Plex Sans for UI; IBM Plex Mono for every number on screen. Tabular figures and tight tracking keep ledger columns lock-step.">
        <div className="flex flex-col gap-4">
          <TypeRow name="Display" token="text-[40px]" props="40 / 44 · 600 · −0.02em"
                   sample={<span style={{ fontSize: 40, lineHeight: "44px", fontWeight: 600, letterSpacing: "-0.02em" }}>A calm system.</span>} />
          <TypeRow name="Title" token="text-[28px]" props="28 / 36 · 600 · −0.01em"
                   sample={<span style={{ fontSize: 28, lineHeight: "36px", fontWeight: 600, letterSpacing: "-0.01em" }}>Income statement trend analysis</span>} />
          <TypeRow name="Heading" token="text-[22px]" props="22 / 30 · 600"
                   sample={<span style={{ fontSize: 22, lineHeight: "30px", fontWeight: 600 }}>Operating expenses</span>} />
          <TypeRow name="Subheading" token="text-[18px]" props="18 / 26 · 400"
                   sample={<span className="text-muted-foreground" style={{ fontSize: 18, lineHeight: "26px" }}>12-month trend, accrual basis</span>} />
          <TypeRow name="Body / default" token="text-[13.5px]" props="13.5 / 20 · 400"
                   sample={<span style={{ fontSize: 13.5, lineHeight: "20px" }}>Cells, controls, and form inputs default here. Comfortable to read across long ledgers.</span>} />
          <TypeRow name="Small / caption" token="text-[12px]" props="12 / 18 · 400"
                   sample={<span className="text-muted-foreground" style={{ fontSize: 12, lineHeight: "18px" }}>Secondary metadata, helper text, table footers.</span>} />
          <TypeRow name="Label / eyebrow" token="text-[11px] · upper" props="11 / 16 · 500 · +0.05em"
                   sample={<span className="text-text-soft uppercase font-medium" style={{ fontSize: 11, letterSpacing: "0.05em" }}>Total income · YTD · % of revenue</span>} />
          <TypeRow name="Mono numeric" token="font-mono" props="IBM Plex Mono · tnum · zero"
                   sample={<span className="font-mono tnum" style={{ fontSize: 18, letterSpacing: "0.01em" }}>$1,247,830.42  ·  +14.2%  ·  (3,420)</span>} />
        </div>
      </Section>

      {/* ============================================================
          03 · Space, radius, elevation
          ============================================================ */}
      <Section no="03 / Tokens" title="Space, radius, elevation"
               sub="A 4-step spacing scale carries every padding and gap. Radii stay small enough to feel professional; elevation is restrained — borders do most of the work.">
        <Block title="Spacing scale">
          <div className="flex flex-col gap-3">
            {[
              ["space-1", 4], ["space-2", 8], ["space-3", 12], ["space-4", 16],
              ["space-5", 20], ["space-6", 24], ["space-8", 32], ["space-10", 40],
              ["space-12", 48], ["space-16", 64],
            ].map(([tok, px]) => (
              <div key={tok} className="grid items-center gap-4" style={{ gridTemplateColumns: "120px 80px 1fr" }}>
                <span className="font-mono text-[12px]">{tok}</span>
                <span className="font-mono text-[12px] text-text-soft">{px}px</span>
                <div className="h-3.5 bg-primary rounded-sm" style={{ width: px }}></div>
              </div>
            ))}
          </div>
        </Block>

        <Block title="Radii">
          <div className="flex items-end gap-5">
            {[
              ["sm", "calc(var(--radius) - 4px)"],
              ["md", "calc(var(--radius) - 2px)"],
              ["lg", "var(--radius)"],
              ["xl", "calc(var(--radius) + 4px)"],
              ["full", "9999px"],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-accent border border-primary/40" style={{ borderRadius: v }}></div>
                <span className="font-mono text-[10.5px] text-text-soft">{k}</span>
              </div>
            ))}
          </div>
        </Block>

        <Block title="Elevation">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-5 shadow-elev-xs">
              <div className="font-medium">XS — hairline lift</div>
              <div className="font-mono text-[10.5px] text-text-soft">shadow-elev-xs</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-5 shadow-elev-sm">
              <div className="font-medium">SM — cards</div>
              <div className="font-mono text-[10.5px] text-text-soft">shadow-elev-sm</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-5 shadow-elev-md">
              <div className="font-medium">MD — popovers</div>
              <div className="font-mono text-[10.5px] text-text-soft">shadow-elev-md</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-5 shadow-elev-lg">
              <div className="font-medium">LG — dialogs</div>
              <div className="font-mono text-[10.5px] text-text-soft">shadow-elev-lg</div>
            </div>
          </div>
        </Block>
      </Section>

      {/* ============================================================
          04 · Components
          ============================================================ */}
      <Section no="04 / Components" title="Components"
               sub="Buttons, inputs, badges, tables — built on the same primitives shadcn/ui ships. Every utility points at the theme tokens above.">
        <Block title="Buttons">
          <div className="bg-card border border-border rounded-lg p-5 flex flex-wrap gap-3 items-center">
            <Button variant="primary">{I.plus}<span>Add transaction</span></Button>
            <Button>Refresh</Button>
            <Button>{I.download}<span>Export</span></Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Cancel</Button>
            <Button variant="destructive">Delete client</Button>
            <Button variant="ghost" size="icon">{I.more}</Button>
            <Button size="sm">{I.filter}<span>Filter</span></Button>
            <Button variant="link">Learn more →</Button>
          </div>
        </Block>

        <Block title="Inputs">
          <div className="bg-card border border-border rounded-lg p-5 flex flex-wrap gap-3 items-center">
            <div className="w-[220px]"><Input placeholder="Account name" /></div>
            <div className="w-[160px]"><Input defaultValue="$24,820.00" className="font-mono tnum text-right" /></div>
            <div className="w-[160px]"><Input type="date" defaultValue="2026-05-28" /></div>
            <div className="w-[200px]"><Input disabled defaultValue="Accrual basis" /></div>
            <Kbd>⌘K</Kbd>
            <Kbd>↵</Kbd>
            <Kbd>esc</Kbd>
          </div>
        </Block>

        <Block title="Badges">
          <div className="bg-card border border-border rounded-lg p-5 flex flex-wrap gap-3 items-center">
            <Badge variant="positive" dot>Reconciled</Badge>
            <Badge variant="warning" dot>Needs review</Badge>
            <Badge variant="destructive" dot>Mismatched</Badge>
            <Badge variant="info">Synced 2m ago</Badge>
            <Badge variant="accent">FY 2026</Badge>
            <Badge variant="default">Draft</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </Block>

        <Block title="Tabs">
          <div className="bg-card border border-border rounded-lg p-5">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsTrigger value="Overview">Overview</TabsTrigger>
              <TabsTrigger value="Activity">Activity</TabsTrigger>
              <TabsTrigger value="Documents">Documents</TabsTrigger>
            </Tabs>
            <div className="mt-3 text-[13px] text-muted-foreground">Active: <span className="text-foreground font-medium">{tab}</span></div>
          </div>
        </Block>

        <Block title="Avatars">
          <div className="bg-card border border-border rounded-lg p-5 flex flex-wrap gap-4 items-center">
            <Avatar size={48}>AC</Avatar>
            <Avatar size={36}>KS</Avatar>
            <Avatar size={32}>NL</Avatar>
            <Avatar size={28}>HC</Avatar>
            <Separator orientation="vertical" className="h-10" />
            <AvatarRound size={36}>JR</AvatarRound>
            <AvatarRound size={28}>PS</AvatarRound>
            <AvatarRound size={22}>MT</AvatarRound>
          </div>
        </Block>

        <Block title="KPI tile">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <div className="p-5 relative">
                <div className="text-[11px] uppercase tracking-wider text-text-soft font-medium mb-3">Total income · YTD</div>
                <div className="font-mono tnum text-[28px] leading-none font-medium tracking-tight mb-2">
                  <span className="text-text-soft text-[0.7em] mr-1">$</span>1,247,830
                </div>
                <div className="text-[12px] text-muted-foreground"><span className="font-mono tnum text-positive font-medium">↑ +14.2%</span> vs prior YTD</div>
                <div className="absolute right-4 top-4 opacity-70">
                  <Sparkline values={[42,48,56,52,61,58,64,72,68,74,82,78]} color="hsl(var(--positive))" />
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-5">
                <div className="text-[11px] uppercase tracking-wider text-text-soft font-medium mb-3">Gross margin</div>
                <div className="font-mono tnum text-[28px] leading-none font-medium tracking-tight mb-2">62.8<span className="text-text-soft">%</span></div>
                <div className="text-[12px] text-muted-foreground"><span className="font-mono tnum text-positive font-medium">↑ +3.1 pts</span> vs prior YTD</div>
              </div>
            </Card>
            <Card>
              <div className="p-5">
                <div className="text-[11px] uppercase tracking-wider text-text-soft font-medium mb-3">Outstanding A/R</div>
                <div className="font-mono tnum text-[28px] leading-none font-medium tracking-tight mb-2 text-warning"><span className="text-text-soft text-[0.7em] mr-1">$</span>48,220</div>
                <div className="text-[12px] text-warning"><span className="font-mono tnum font-medium">6 invoices</span> &gt; 30 days</div>
              </div>
            </Card>
          </div>
        </Block>

        <Block title="Table">
          <Card>
            <table className="w-full text-[13.5px]">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="text-left h-9 px-3 text-[11px] uppercase tracking-wider text-text-soft font-medium">Date</th>
                  <th className="text-left h-9 px-3 text-[11px] uppercase tracking-wider text-text-soft font-medium">Account</th>
                  <th className="text-left h-9 px-3 text-[11px] uppercase tracking-wider text-text-soft font-medium">Memo</th>
                  <th className="text-right h-9 px-3 text-[11px] uppercase tracking-wider text-text-soft font-medium">Debit</th>
                  <th className="text-right h-9 px-3 text-[11px] uppercase tracking-wider text-text-soft font-medium">Credit</th>
                  <th className="text-left h-9 px-3 text-[11px] uppercase tracking-wider text-text-soft font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["05/24", "4010 Wholesale roasted coffee", "Blue Bottle — invoice #2241", "—", "12,480.00", <Badge key="b" variant="positive" dot>Reconciled</Badge>],
                  ["05/24", "5010 Green coffee purchases",   "Cafe Imports — PO 8814",     "8,940.00", "—", <Badge key="b" variant="warning" dot>Needs review</Badge>],
                  ["05/22", "6030 Rent & occupancy",         "Roastery lease — May",       "14,800.00", "—", <Badge key="b" variant="positive" dot>Reconciled</Badge>],
                  ["05/21", "4020 Retail café sales",        "Square daily settlement",    "—", "6,210.40", <Badge key="b" variant="info">Auto</Badge>],
                ].map((r, i) => (
                  <tr key={i} className="border-b border-border/60 hover:bg-muted/60 transition-colors" style={{ height: 40 }}>
                    <td className="px-3 font-mono text-[12.5px]">{r[0]}</td>
                    <td className="px-3">{r[1]}</td>
                    <td className="px-3 text-muted-foreground">{r[2]}</td>
                    <td className="px-3 text-right font-mono tnum">{r[3]}</td>
                    <td className="px-3 text-right font-mono tnum">{r[4]}</td>
                    <td className="px-3">{r[5]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Block>
      </Section>

      {/* ============================================================
          05 · Number rules
          ============================================================ */}
      <Section no="05 / Patterns" title="Number rules"
               sub="Every number renders in IBM Plex Mono with tabular figures and zero-style slashed zero. Negatives wear parentheses; missing values render as an em-dash; future periods desaturate into the muted surface.">
        <Card>
          <table className="w-full text-[13.5px]">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="text-left h-9 px-3 text-[11px] uppercase tracking-wider text-text-soft font-medium">Case</th>
                <th className="text-right h-9 px-3 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[140px]">Renders as</th>
                <th className="text-left h-9 px-3 text-[11px] uppercase tracking-wider text-text-soft font-medium">Why</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/60"><td className="px-3 h-10">Positive</td><td className="px-3 text-right font-mono tnum">12,480</td><td className="px-3 text-muted-foreground">Plain mono numeral, no sign</td></tr>
              <tr className="border-b border-border/60"><td className="px-3 h-10">Negative</td><td className="px-3 text-right font-mono tnum text-destructive">(3,420)</td><td className="px-3 text-muted-foreground">Accountant parentheses, negative color</td></tr>
              <tr className="border-b border-border/60"><td className="px-3 h-10">Zero / no activity</td><td className="px-3 text-right font-mono text-text-soft">—</td><td className="px-3 text-muted-foreground">Em-dash, soft color — never the digit 0</td></tr>
              <tr className="border-b border-border/60"><td className="px-3 h-10 bg-muted/60"><span>Future period</span></td><td className="px-3 text-right font-mono text-text-soft bg-muted/60">—</td><td className="px-3 text-muted-foreground">Muted surface tint signals "not yet posted"</td></tr>
              <tr className="border-b border-border/60"><td className="px-3 h-10">Subtotal</td><td className="px-3 text-right font-mono tnum font-semibold border-t border-border-strong">764,920</td><td className="px-3 text-muted-foreground">Top hairline + 600 weight</td></tr>
              <tr><td className="px-3 h-10">Grand total</td><td className="px-3 text-right font-mono tnum font-semibold text-primary" style={{ borderBottom: "3px double hsl(var(--border-strong))" }}>312,440</td><td className="px-3 text-muted-foreground">Double underline + primary color</td></tr>
            </tbody>
          </table>
        </Card>
      </Section>

      <footer className="text-center pt-8 border-t border-border text-text-soft text-[13px]">
        <a className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
           href="Profit %26 Loss.html">See the system in production — open the P&amp;L screen →</a>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<DS />);
