/* global React, ReactDOM, PageShell, Button, Input, Kbd, Badge, Card, CardHeader, CardTitle,
            CardFooter, Avatar, AvatarRound, cn, I */

const { useState, useMemo } = React;

const STEPS = [
  { key: "basics",  label: "Business basics",   sub: "Name, entity, fiscal year" },
  { key: "books",   label: "Connect books",     sub: "QBO, Xero, or start fresh" },
  { key: "feeds",   label: "Bank feeds",        sub: "Finicity connections" },
  { key: "team",    label: "Assign team",       sub: "Who owns this client" },
  { key: "review",  label: "Review & invite",   sub: "Confirm and send invite" },
];

/* ---------- Stepper ---------- */
function Stepper({ current }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex items-stretch">
        {STEPS.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <React.Fragment key={s.key}>
              <div className={cn("flex items-center gap-3 flex-1 min-w-0",
                                    active ? "" : "opacity-60")}>
                <div className={cn(
                  "w-7 h-7 rounded-full grid place-items-center flex-shrink-0 font-mono text-[12px] font-semibold transition-colors",
                  done   ? "bg-positive text-white" :
                  active ? "bg-primary text-primary-foreground" :
                           "bg-secondary text-text-soft border border-border"
                )}>
                  {done ? <span className="w-3.5 h-3.5">{I.check}</span> : i + 1}
                </div>
                <div className="min-w-0">
                  <div className={cn("text-[12.5px] font-medium truncate",
                                       active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground")}>
                    {s.label}
                  </div>
                  <div className="text-[11px] text-text-soft truncate">{s.sub}</div>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex items-center px-2 flex-shrink-0">
                  <div className={cn("w-8 h-px", done ? "bg-positive" : "bg-border")} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Section wrapper ---------- */
function Section({ title, sub, children }) {
  return (
    <div className="mb-7">
      <h3 className="text-[15px] font-semibold mb-1">{title}</h3>
      {sub && <p className="text-[13px] text-muted-foreground mb-4">{sub}</p>}
      {children}
    </div>
  );
}
function Field({ label, hint, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium text-muted-foreground flex items-center gap-1.5">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {hint && <div className="text-[11.5px] text-text-soft">{hint}</div>}
    </div>
  );
}

/* ---------- Selector card ---------- */
function ChoiceCard({ active, icon, title, desc, badge, onClick }) {
  return (
    <button onClick={onClick}
            className={cn(
              "flex items-start gap-4 p-4 border rounded-lg text-left transition-all",
              active
                ? "border-primary bg-accent ring-2 ring-accent"
                : "border-border bg-card hover:border-border-strong hover:bg-muted/40"
            )}>
      <div className={cn("w-9 h-9 rounded-md grid place-items-center flex-shrink-0",
                          active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
        <span className="w-4 h-4">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-semibold">{title}</div>
          {badge && <Badge variant="accent" className="text-[10px] h-5 px-2">{badge}</Badge>}
        </div>
        <div className="text-[12.5px] text-muted-foreground mt-0.5">{desc}</div>
      </div>
      <div className={cn(
        "w-4 h-4 rounded-full border-2 flex-shrink-0 mt-1",
        active ? "border-primary bg-primary" : "border-border-strong"
      )}>
        {active && <span className="block w-1.5 h-1.5 rounded-full bg-card mx-auto mt-[3px]" />}
      </div>
    </button>
  );
}

/* ---------- Step bodies ---------- */
function StepBasics({ form, setForm }) {
  return (
    <>
      <Section title="Who are you setting up?" sub="The business owner will get an invite to this account at the end.">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Business name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Atlas Coffee Roasters" />
          </Field>
          <Field label="Doing business as (DBA)" hint="Optional â€” used on financial statements">
            <Input placeholder="optional" />
          </Field>
          <Field label="Entity type" required>
            <select className="h-8 px-3 rounded-md border border-input bg-card text-[13.5px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/30">
              <option>LLC</option>
              <option>S-Corp</option>
              <option>C-Corp</option>
              <option>PLLC</option>
              <option>Sole proprietorship</option>
              <option>Partnership</option>
              <option>Non-profit</option>
            </select>
          </Field>
          <Field label="Industry" required>
            <Input defaultValue="Food & Beverage" />
          </Field>
          <Field label="EIN" hint="Federal employer ID (XX-XXXXXXX)">
            <Input className="font-mono" placeholder="00-0000000" />
          </Field>
          <Field label="State of formation">
            <Input defaultValue="California" />
          </Field>
        </div>
      </Section>

      <Section title="Fiscal year & accounting" sub="These affect how reports roll up. You can change them later.">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Fiscal year start" hint="Most US small businesses: January 1">
            <select className="h-8 px-3 rounded-md border border-input bg-card text-[13.5px]">
              <option>January 1</option><option>April 1</option><option>July 1</option><option>October 1</option><option>Customâ€¦</option>
            </select>
          </Field>
          <Field label="Accounting basis">
            <select className="h-8 px-3 rounded-md border border-input bg-card text-[13.5px]">
              <option>Accrual</option><option>Cash</option>
            </select>
          </Field>
          <Field label="Currency">
            <select className="h-8 px-3 rounded-md border border-input bg-card text-[13.5px]">
              <option>USD ($)</option><option>CAD ($)</option><option>GBP (Â£)</option><option>EUR (â‚¬)</option>
            </select>
          </Field>
        </div>
      </Section>
    </>
  );
}

function StepBooks({ form, setForm }) {
  const choices = [
    { key: "qbo",   icon: I.link,     title: "Import from QuickBooks Online", desc: "Sync existing chart of accounts, customers, vendors, and history.", badge: "Recommended" },
    { key: "xero",  icon: I.link,     title: "Import from Xero",              desc: "Sync existing chart of accounts and historical transactions." },
    { key: "csv",   icon: I.download, title: "Upload trial balance (CSV)",    desc: "We'll build the chart of accounts from your file." },
    { key: "fresh", icon: I.plus,     title: "Start fresh",                    desc: "Use the Accounting Completed's standard chart of accounts for your industry." },
  ];
  return (
    <>
      <Section title="How would you like to bring in their books?" sub="Choose one â€” you can connect additional sources later from Settings â†’ Integrations.">
        <div className="grid grid-cols-2 gap-3">
          {choices.map(c => (
            <ChoiceCard key={c.key}
                        active={form.books === c.key}
                        icon={c.icon} title={c.title} desc={c.desc} badge={c.badge}
                        onClick={() => setForm({ ...form, books: c.key })} />
          ))}
        </div>
      </Section>

      {form.books === "qbo" && (
        <Section title="QuickBooks Online connection" sub="We'll redirect to QBO to authorize. Read-only sync â€” we never write back unless you ask.">
          <div className="border border-border rounded-lg p-5 bg-muted/40 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#2CA01C] to-[#1F7717] grid place-items-center text-white font-bold text-[14px]">QB</div>
            <div className="flex-1">
              <div className="font-medium">Intuit QuickBooks Online</div>
              <div className="text-[12px] text-muted-foreground">We'll pull last 24 months of history by default. You can request older periods after connecting.</div>
            </div>
            <Button variant="primary">{I.link}<span>Connect to QBO</span></Button>
          </div>
        </Section>
      )}

      {form.books === "fresh" && (
        <Section title="Pick a starting chart of accounts" sub="You can customize after setup.">
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: "Standard small business",   accounts: 42, badge: "Most popular" },
              { name: "Food & Beverage",           accounts: 58 },
              { name: "Professional services",     accounts: 38 },
              { name: "Retail & e-commerce",       accounts: 52 },
            ].map((t, i) => (
              <div key={i} className="border border-border rounded-lg p-4 bg-card hover:bg-muted/40 cursor-pointer">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{t.name}</span>
                  {t.badge && <Badge variant="accent" className="h-5 text-[10px] px-2">{t.badge}</Badge>}
                </div>
                <div className="text-[12px] text-muted-foreground">{t.accounts} accounts Â· 5 sections</div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

function StepFeeds() {
  return (
    <>
      <Section title="Connect bank & credit card accounts" sub="Skip this step and the owner can connect on their first login.">
        <div className="border border-border rounded-lg p-6 bg-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="font-medium">Pending invitations</div>
              <div className="text-[12.5px] text-muted-foreground">The owner will receive a Finicity link to authorize each account.</div>
            </div>
            <Button>{I.plus}<span>Add institution</span></Button>
          </div>

          <div className="space-y-2">
            {[
              { name: "Chase Business Checking", mask: "â€¢â€¢â€¢â€¢ 5847", status: "queued" },
              { name: "Chase Business Credit",   mask: "â€¢â€¢â€¢â€¢ 9921", status: "queued" },
              { name: "Amex Platinum Business",  mask: "â€¢â€¢â€¢â€¢ 1124", status: "queued" },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-3 px-3 h-12 border border-border rounded-md bg-muted/40">
                <span className="w-2 h-2 rounded-full bg-warning" />
                <div className="flex-1">
                  <div className="font-medium text-[13.5px]">{a.name}</div>
                  <div className="text-[11.5px] text-text-soft font-mono">{a.mask} Â· awaiting owner auth</div>
                </div>
                <Button size="sm" variant="ghost">{I.x}<span>Remove</span></Button>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Statement import" sub="No bank feed available? Upload statements manually.">
        <div className="border border-dashed border-border-strong rounded-md p-8 text-center text-muted-foreground bg-card">
          <div className="w-10 h-10 mx-auto rounded-md bg-secondary text-text-soft grid place-items-center mb-2">
            <span className="w-4 h-4">{I.download}</span>
          </div>
          <div className="text-[13.5px] text-foreground font-medium mb-1">Drop CSV, OFX, QFX, or QBO files here</div>
          <div className="text-[12px]">or <button className="text-primary hover:underline">browse files</button></div>
        </div>
      </Section>
    </>
  );
}

function StepTeam({ form, setForm }) {
  const STAFF_OPTIONS = [
    { initials: "ST", name: "Scott Turner",  role: "Senior bookkeeper", clients: 8, suggested: true },
    { initials: "PS", name: "Priya Sharma",  role: "Senior bookkeeper", clients: 7 },
    { initials: "MT", name: "Marcus Tran",   role: "Bookkeeper",        clients: 9 },
    { initials: "LW", name: "Lou Whitaker",  role: "Bookkeeper",        clients: 4 },
    { initials: "SN", name: "Sara Ng",       role: "Read-only",         clients: 12 },
  ];
  const togglePick = (i) => {
    const next = new Set(form.team);
    if (next.has(i)) next.delete(i); else next.add(i);
    setForm({ ...form, team: next });
  };
  return (
    <>
      <Section title="Assign team members" sub="Picked staff get access to this client's books based on their role.">
        <div className="space-y-2">
          {STAFF_OPTIONS.map((s, i) => {
            const picked = form.team.has(i);
            return (
              <button key={i} onClick={() => togglePick(i)}
                      className={cn(
                        "w-full flex items-center gap-4 p-3 border rounded-md text-left transition-colors",
                        picked ? "border-primary bg-accent ring-2 ring-accent" : "border-border bg-card hover:bg-muted/40"
                      )}>
                <div className={cn("w-4 h-4 rounded-sm border-2 flex-shrink-0 grid place-items-center",
                                      picked ? "border-primary bg-primary" : "border-border-strong")}>
                  {picked && <span className="w-2.5 h-2.5 text-primary-foreground">{I.check}</span>}
                </div>
                <AvatarRound size={32}>{s.initials}</AvatarRound>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{s.name}</span>
                    {s.suggested && <Badge variant="accent" className="h-5 text-[10px] px-2">Lead suggested</Badge>}
                  </div>
                  <div className="text-[11.5px] text-text-soft">{s.role} Â· currently on {s.clients} clients</div>
                </div>
                {picked && (
                  <select className="h-8 px-2 rounded-md border border-input bg-card text-[12px]" onClick={(e) => e.stopPropagation()}>
                    <option>Editor</option><option>Reviewer</option><option>Read-only</option>
                  </select>
                )}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Lead bookkeeper" sub="Approves work and owns the relationship. One person.">
        <div className="border border-border rounded-md p-3 bg-muted/40 flex items-center gap-3">
          <AvatarRound size={28}>ST</AvatarRound>
          <div className="flex-1">
            <div className="text-[13.5px] font-medium">Scott Turner</div>
            <div className="text-[11.5px] text-text-soft">Senior bookkeeper Â· 8 clients Â· 92% on-time close rate</div>
          </div>
          <Button size="sm" variant="ghost">Change</Button>
        </div>
      </Section>
    </>
  );
}

function StepReview({ form }) {
  return (
    <>
      <Section title="Ready to invite the owner" sub="Sending will create the client workspace and email the owner a login link.">
        <Card>
          <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
            <CardTitle>{form.name || "Atlas Coffee Roasters"}</CardTitle>
            <Badge variant="accent">LLC Â· Food & Beverage</Badge>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 p-5 text-[13px]">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-text-soft font-medium mb-1">Books source</div>
              <div className="font-medium flex items-center gap-2">
                {I.link}{" "}
                <span>{form.books === "qbo" ? "QuickBooks Online" : form.books === "xero" ? "Xero" : form.books === "csv" ? "Trial balance upload" : "Fresh chart of accounts"}</span>
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-text-soft font-medium mb-1">Bank connections</div>
              <div className="font-medium">3 institutions queued for owner auth</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-text-soft font-medium mb-1">Fiscal year</div>
              <div className="font-medium font-mono">Jan 1 â†’ Dec 31 Â· Accrual Â· USD</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-text-soft font-medium mb-1">Team</div>
              <div className="font-medium">{form.team.size || 1} staff assigned Â· Lead: Scott T.</div>
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Owner invitation" sub="The business owner will receive this invite email immediately.">
        <Card>
          <div className="p-5 space-y-3">
            <Field label="Owner email" required>
              <Input placeholder="owner@atlascoffee.com" />
            </Field>
            <Field label="Owner full name" required>
              <Input placeholder="e.g. Diego MarÃ­n" />
            </Field>
            <Field label="Personal note (optional)" hint="Appears at the top of the invite email">
              <textarea
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-card text-[13.5px] resize-y focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                placeholder="Hi Diego â€” really excited to start working together on Atlas's books. Logging in here will let you connect your bank accounts so we can get rollingâ€¦"
              />
            </Field>
            <div className="flex items-start gap-3 p-3 bg-accent rounded-md">
              <span className="w-4 h-4 text-primary mt-0.5">{I.zap}</span>
              <div className="flex-1 text-[12.5px] text-primary">
                Accounting Completed will run automated checks on the first sync â€” duplicate detection, unbalanced JEs, and chart-of-accounts gaps. You'll get a summary in your inbox.
              </div>
            </div>
          </div>
        </Card>
      </Section>
    </>
  );
}

/* ---------- App ---------- */
function App() {
  const [step, setStep] = useState(1); // 0..4
  const [form, setForm] = useState({
    name: "",
    books: "qbo",
    team: new Set([0]), // Scott default
  });

  const StepBody = [StepBasics, StepBooks, StepFeeds, StepTeam, StepReview][step];

  return (
    <PageShell activeKey="clients" crumbs={["Clients", "Add new"]}>
      <div className="flex items-end justify-between gap-6 mb-6 flex-wrap">
        <div>
          <h1 className="text-[28px] leading-9 font-semibold tracking-tight m-0 mb-1">Add a new client</h1>
          <p className="text-[15px] text-muted-foreground">Five steps Â· about 4 minutes Â· saves a draft as you go</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost">Save & exit</Button>
        </div>
      </div>

      <Stepper current={step} />

      <Card className="mb-6">
        <div className="p-6 max-w-[760px]">
          <StepBody form={form} setForm={setForm} />
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/40 flex items-center justify-between">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep(Math.max(0, step - 1))}>
            â† Back
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-text-soft">Step <span className="font-mono text-foreground">{step + 1}</span> of <span className="font-mono text-foreground">{STEPS.length}</span></span>
            <Button variant="ghost">Skip</Button>
            {step < STEPS.length - 1 ? (
              <Button variant="primary" onClick={() => setStep(step + 1)}>
                Continue <span className="ml-1 opacity-70"><Kbd>â†µ</Kbd></span>
              </Button>
            ) : (
              <Button variant="primary">{I.check}<span>Send invite & finish</span></Button>
            )}
          </div>
        </div>
      </Card>

      <div className="text-center text-[12px] text-text-soft">
        Need help? <a href="#" className="text-primary hover:underline">Watch the 2-min walkthrough â†’</a>
      </div>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
