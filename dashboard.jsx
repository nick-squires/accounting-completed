/* global React, ReactDOM, PageShell, PageHeader, StatTile, Button, Badge, Card, CardHeader, CardTitle,
            CardContent, CardFooter, Avatar, AvatarRound, Sparkline, cn, I, CLIENTS */

const { useState, useMemo } = React;

/* ---------- Activity feed -------------------------------------------------- */
const ACTIVITY = [
  { who: "Priya S.",  initials: "PS", action: "approved 18 transactions for", client: "Northstar Logistics",  what: "Bank rules matched Â· $12,480.21", time: "8m ago", kind: "approve" },
  { who: "Scott T.", initials: "ST", action: "reconciled May statement for",  client: "Atlas Coffee Roasters", what: "Chase Business Checking Â·5847", time: "32m ago", kind: "reconcile" },
  { who: "System",    initials: "Â·Â·", action: "pulled new bank transactions for", client: "Sentinel Security",  what: "14 new transactions from Finicity", time: "1h ago", kind: "system" },
  { who: "Marcus T.", initials: "MT", action: "asked a question on",          client: "Meridian Dental Group", what: "â€œIs this travel re-imbursable?â€", time: "2h ago", kind: "comment" },
  { who: "Priya S.",  initials: "PS", action: "closed April period for",      client: "Halcyon Yoga Studio",   what: "Books locked through 04/30/26", time: "Yesterday", kind: "close" },
  { who: "Scott T.", initials: "ST", action: "created a new rule on",        client: "Atlas Coffee Roasters", what: "â€œSquare Settlementâ€ â†’ 4020 Retail", time: "Yesterday", kind: "rule" },
  { who: "System",    initials: "Â·Â·", action: "flagged 2 duplicate entries on", client: "Bluepine Brewing",    what: "Possible duplicates Â· awaiting review", time: "2d ago", kind: "alert" },
];

const ACTIVITY_ICON = {
  approve:   { bg: "bg-positive/15 text-positive", icon: I.check },
  reconcile: { bg: "bg-accent text-accent-foreground", icon: I.check },
  system:    { bg: "bg-secondary text-muted-foreground", icon: I.refresh },
  comment:   { bg: "bg-info-soft text-info", icon: I.alert },
  close:     { bg: "bg-positive/15 text-positive", icon: I.check },
  rule:      { bg: "bg-accent text-accent-foreground", icon: I.zap },
  alert:     { bg: "bg-warning-soft text-warning", icon: I.alert },
};

function ActivityRow({ a }) {
  const meta = ACTIVITY_ICON[a.kind] || ACTIVITY_ICON.system;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/60 last:border-b-0">
      <div className={cn("w-7 h-7 rounded-full grid place-items-center flex-shrink-0 mt-0.5", meta.bg)}>
        <span className="w-3.5 h-3.5 grid place-items-center">{meta.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-foreground leading-snug">
          <span className="font-medium">{a.who}</span>{" "}
          <span className="text-muted-foreground">{a.action}</span>{" "}
          <span className="font-medium">{a.client}</span>
        </div>
        <div className="text-[12px] text-text-soft mt-0.5 truncate">{a.what}</div>
      </div>
      <div className="text-[11px] text-text-soft whitespace-nowrap mt-1">{a.time}</div>
    </div>
  );
}

/* ---------- Deadlines list -------------------------------------------------- */
const DEADLINES = [
  { date: "May 30",  label: "Sales tax filing â€” CA",         client: "Atlas Coffee Roasters", in: "2 days", urgent: true },
  { date: "May 31",  label: "Monthly close â€” May",           client: "Atlas Coffee Roasters", in: "3 days", urgent: true },
  { date: "Jun 02",  label: "Quarterly estimates â€” Q2",      client: "Kestrel Studio",        in: "5 days" },
  { date: "Jun 05",  label: "Form 941 â€” payroll taxes",      client: "Northstar Logistics",   in: "8 days" },
  { date: "Jun 10",  label: "Worker's comp audit",           client: "Anchor & Oak Furniture",in: "13 days" },
  { date: "Jun 15",  label: "Quarterly estimates â€” Q2",      client: "Sentinel Security",     in: "18 days" },
];

/* ---------- Workload (priority-sorted clients) ----------------------------- */
function WorkloadRow({ c }) {
  const isReview = c.flag === "needs-review";
  const isOpen = c.openTasks > 0;
  const urgency = isReview ? "needs-review" : isOpen ? "active" : "clean";

  return (
    <a href="Profit %26 Loss.html"
       className="flex items-center gap-3 px-4 h-14 border-b border-border/60 last:border-b-0 hover:bg-muted/60 transition-colors group">
      <Avatar size={32}>{c.initials}</Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{c.name}</span>
          {urgency === "needs-review" && <Badge variant="warning" dot>{c.openTasks} to review</Badge>}
          {urgency === "active" && !isReview && <Badge variant="info">{c.openTasks} open</Badge>}
          {urgency === "clean" && <Badge variant="positive" dot>Up to date</Badge>}
        </div>
        <div className="text-[11.5px] text-text-soft mt-0.5">
          <span className="font-mono">{c.entity}</span>
          <span className="mx-1.5">Â·</span>
          <span>{c.industry}</span>
          <span className="mx-1.5">Â·</span>
          <span>Owner: <span className="text-foreground/80">{c.owner}</span></span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {c.spark && <Sparkline values={c.spark} width={84} height={24} color={isReview ? "hsl(var(--warning))" : "hsl(var(--primary))"} />}
        <span className="text-[11.5px] text-text-soft w-16 text-right">{c.opened}</span>
        <span className="text-text-soft opacity-0 group-hover:opacity-100 transition-opacity">{I.chevRight}</span>
      </div>
    </a>
  );
}

/* ---------- App ---------- */
function App() {
  const [filter, setFilter] = useState("priority"); // priority | mine | review

  const stats = useMemo(() => {
    const active = CLIENTS.filter(c => c.flag !== "archived");
    return {
      tasks: active.reduce((s, c) => s + c.openTasks, 0),
      review: active.filter(c => c.flag === "needs-review").length,
      clean: active.filter(c => c.openTasks === 0 && c.flag !== "archived").length,
      mine: active.filter(c => c.owner === "Scott T.").length,
      newFeeds: 7,
    };
  }, []);

  const workload = useMemo(() => {
    const active = CLIENTS.filter(c => c.flag !== "archived");
    let list = active;
    if (filter === "mine") list = list.filter(c => c.owner === "Scott T.");
    if (filter === "review") list = list.filter(c => c.flag === "needs-review");
    // Sort: review first, then by openTasks desc, then pinned
    return [...list].sort((a, b) => {
      const score = (c) => (c.flag === "needs-review" ? 1000 : 0) + c.openTasks * 10 + (c.pinned ? 1 : 0);
      return score(b) - score(a);
    }).slice(0, 10);
  }, [filter]);

  return (
    <PageShell activeKey="dash" crumbs={["Home"]}>
      {/* Hero */}
      <div className="mb-6 flex items-end justify-between gap-6 flex-wrap">
        <div>
          <div className="text-[12px] text-text-soft font-medium uppercase tracking-wider mb-1">
            Thursday Â· May 28
          </div>
          <h1 className="text-[32px] leading-[1.1] font-semibold tracking-tight m-0">
            Good morning, Scott.
          </h1>
          <p className="text-[15px] text-muted-foreground mt-2 max-w-[60ch]" style={{ textWrap: "pretty" }}>
            You have <span className="text-foreground font-medium font-mono tnum">{stats.tasks}</span> open items across <span className="text-foreground font-medium font-mono tnum">{stats.mine}</span> clients. <span className="text-warning font-medium">{stats.review} clients need review today.</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button>{I.refresh}<span>Refresh feeds</span></Button>
          <Button>{I.plus}<span>Quick journal entry</span></Button>
          <Button variant="primary">{I.plus}<span>Add client</span></Button>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatTile label="Needs review"
                  value={stats.review}
                  sub="awaiting your action"
                  intent="warning" />
        <StatTile label="Open tasks"
                  value={stats.tasks}
                  sub="across all my clients"
                  intent="accent" />
        <StatTile label="New bank items"
                  value={stats.newFeeds}
                  sub="imported overnight" />
        <StatTile label="Books up to date"
                  value={stats.clean}
                  sub="zero pending items"
                  intent="positive" />
      </div>

      {/* Two-column main */}
      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 380px" }}>
        {/* Left: Workload */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CardTitle>Your workload</CardTitle>
              <span className="text-[12.5px] text-muted-foreground">prioritized for today</span>
            </div>
            <div className="flex items-center gap-1 bg-muted border border-border rounded-md p-[3px]">
              {[
                { v: "priority", l: "Priority" },
                { v: "mine",     l: "Assigned to me" },
                { v: "review",   l: "Review only" },
              ].map(opt => (
                <button key={opt.v}
                        onClick={() => setFilter(opt.v)}
                        className={cn(
                          "h-6 px-3 rounded text-[12px] font-medium transition-colors whitespace-nowrap",
                          filter === opt.v ? "bg-card text-foreground shadow-elev-xs" : "text-muted-foreground hover:text-foreground"
                        )}>
                  {opt.l}
                </button>
              ))}
            </div>
          </CardHeader>

          <div className="divide-y divide-border/60">
            {workload.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">No clients match this view.</div>
            ) : workload.map(c => <WorkloadRow key={c.id} c={c} />)}
          </div>

          <CardFooter>
            <div className="flex items-center justify-between w-full">
              <span>Showing top <span className="font-mono text-foreground">{workload.length}</span> Â· <a href="Clients.html" className="text-primary hover:underline">See all clients â†’</a></span>
              <span>Updated <span className="font-mono text-foreground">just now</span></span>
            </div>
          </CardFooter>
        </Card>

        {/* Right column */}
        <div className="flex flex-col gap-6 min-w-0">
          {/* Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming deadlines</CardTitle>
              <a href="#" className="text-[12px] text-primary hover:underline">Calendar â†’</a>
            </CardHeader>
            <div className="px-5 py-2">
              {DEADLINES.map((d, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-border/60 last:border-b-0">
                  <div className={cn(
                    "w-10 flex-shrink-0 text-center py-0.5 rounded-md border",
                    d.urgent
                      ? "border-warning/40 bg-warning-soft text-warning"
                      : "border-border bg-card text-muted-foreground"
                  )}>
                    <div className="text-[9.5px] uppercase tracking-wider leading-3">{d.date.split(" ")[0]}</div>
                    <div className="font-mono text-[14px] font-medium leading-4">{d.date.split(" ")[1]}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">{d.label}</div>
                    <div className="text-[11.5px] text-text-soft truncate">{d.client}</div>
                  </div>
                  <div className={cn("text-[11px] whitespace-nowrap mt-0.5", d.urgent ? "text-warning font-medium" : "text-text-soft")}>
                    in {d.in}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Activity feed */}
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <a href="#" className="text-[12px] text-primary hover:underline">All â†’</a>
            </CardHeader>
            <div className="px-5 py-2">
              {ACTIVITY.map((a, i) => <ActivityRow key={i} a={a} />)}
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
