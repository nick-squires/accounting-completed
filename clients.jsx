/* global React, ReactDOM, Button, Input, Kbd, Badge, Card, CardHeader, CardTitle, CardContent,
            CardFooter, Tabs, TabsTrigger, Avatar, AvatarRound, Sparkline, cn,
            Sidebar, Topbar, I, ClientPicker, CLIENTS, useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor */

const { useState, useMemo, useEffect } = React;

/* =========================================================
   Filter chip + sort menu helpers
   ========================================================= */
function FilterChip({ active, label, value, count, onClick }) {
  return (
    <button onClick={onClick}
            className={cn(
              "inline-flex items-center gap-1.5 h-8 px-3 rounded-md border text-[13px] transition-colors",
              active
                ? "bg-accent text-accent-foreground border-accent"
                : "bg-card text-muted-foreground border-border hover:bg-secondary hover:text-foreground hover:border-border-strong"
            )}>
      <span>{label}</span>
      {value && <span className="text-text-soft">·</span>}
      {value && <span className="font-medium text-foreground">{value}</span>}
      {count !== undefined && (
        <span className={cn("font-mono tnum text-[11px]", active ? "text-primary" : "text-text-soft")}>
          {count}
        </span>
      )}
      <span className="text-text-soft -mr-1">{I.chevDown}</span>
    </button>
  );
}

/* =========================================================
   KPI tile (mini)
   ========================================================= */
function StatTile({ label, value, sub, intent }) {
  const intents = {
    default:  "bg-card",
    accent:   "bg-card",
    warning:  "bg-card",
    positive: "bg-card",
  };
  return (
    <Card className={intents[intent || "default"]}>
      <div className="p-5">
        <div className="text-[11px] font-medium uppercase tracking-wider text-text-soft mb-3">{label}</div>
        <div className={cn("font-mono tnum text-[28px] leading-none font-medium tracking-tight",
                            intent === "warning"  ? "text-warning" :
                            intent === "positive" ? "text-positive" :
                            intent === "accent"   ? "text-primary" :
                            "text-foreground")}>
          {value}
        </div>
        {sub && <div className="text-[12px] text-muted-foreground mt-2">{sub}</div>}
      </div>
    </Card>
  );
}

/* =========================================================
   Client row
   ========================================================= */
function StatusCell({ c }) {
  if (c.flag === "needs-review") {
    return <Badge variant="warning" dot>{c.openTasks} to review</Badge>;
  }
  if (c.flag === "archived") {
    return <Badge variant="default">Archived</Badge>;
  }
  if (c.openTasks > 0) {
    return <Badge variant="info">{c.openTasks} open</Badge>;
  }
  return <Badge variant="positive" dot>Up to date</Badge>;
}

function BooksHealth({ c }) {
  // Derive a reasonable "% reconciled" from the openTasks count + flag
  let pct;
  if (c.flag === "archived") return <span className="text-text-soft text-[12px]">—</span>;
  if (c.flag === "needs-review") pct = 60 + (Math.random() * 10 - 5);
  else if (c.openTasks === 0) pct = 100;
  else pct = 100 - c.openTasks * 4;
  pct = Math.round(Math.max(40, Math.min(100, pct)));
  const color = pct >= 95 ? "bg-positive" : pct >= 80 ? "bg-info" : pct >= 65 ? "bg-warning" : "bg-destructive";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono tnum text-[12px] text-text-soft w-8">{pct}%</span>
    </div>
  );
}

/* =========================================================
   Page
   ========================================================= */
const TWEAK_DEFAULTS_CLIENTS = /*EDITMODE-BEGIN*/{
  "accent":   "#0B5C8C",
  "density":  "comfy",
  "viewMode": "table"
}/*EDITMODE-END*/;

const ACCENT_HSL = {
  "#0B5C8C": "202 85% 30%",
  "#0E7C86": "184 81% 29%",
  "#1D4ED8": "224 76% 48%",
  "#5C3FB5": "256 49% 47%",
  "#0F1724": "217 43% 10%",
};

function App() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | archived | review
  const [ownerFilter,  setOwnerFilter]  = useState("all");
  const [sortBy, setSortBy] = useState("recent"); // recent | name | tasks

  const owners = useMemo(() => ["all", ...Array.from(new Set(CLIENTS.map(c => c.owner)))], []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return CLIENTS.filter(c => {
      if (needle) {
        const hay = `${c.name} ${c.entity} ${c.industry} ${c.owner}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (statusFilter === "active"   && c.flag === "archived") return false;
      if (statusFilter === "archived" && c.flag !== "archived") return false;
      if (statusFilter === "review"   && c.flag !== "needs-review") return false;
      if (ownerFilter !== "all" && c.owner !== ownerFilter) return false;
      return true;
    });
  }, [q, statusFilter, ownerFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortBy === "name") arr.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "tasks") arr.sort((a, b) => b.openTasks - a.openTasks);
    arr.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    return arr;
  }, [filtered, sortBy]);

  const counts = useMemo(() => ({
    total:    CLIENTS.length,
    active:   CLIENTS.filter(c => c.flag !== "archived").length,
    review:   CLIENTS.filter(c => c.flag === "needs-review").length,
    archived: CLIENTS.filter(c => c.flag === "archived").length,
    openTasks:CLIENTS.reduce((s, c) => s + c.openTasks, 0),
  }), []);

  return (
    <PageShell activeKey="clients" crumbs={["Setup", "Clients"]}>
      {/* Page header */}
      <div className="flex items-end justify-between gap-6 mb-6 flex-wrap">
        <div>
          <h1 className="text-[28px] leading-9 font-semibold tracking-tight m-0 mb-1">Clients</h1>
          <div className="text-[15px] text-muted-foreground">
            <span className="font-mono text-foreground font-medium">{counts.active}</span> active clients managed by your firm
            {counts.review > 0 && (
              <>
                {" · "}
                <span className="text-warning font-medium">{counts.review} need review</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button>{I.download}<span>Export list</span></Button>
          <Button>{I.link}<span>Invite</span></Button>
          <a href="Add Client.html" className="inline-flex items-center gap-2 h-8 px-3 rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/90 border border-primary text-[13.5px] whitespace-nowrap">
            {I.plus}<span>Add client</span>
          </a>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatTile label="Total clients"   value={counts.total} sub={`${counts.active} active · ${counts.archived} archived`} />
        <StatTile label="Open tasks"      value={counts.openTasks} sub="across all clients" intent="accent" />
        <StatTile label="Needs review"    value={counts.review} sub="awaiting your action" intent="warning" />
        <StatTile label="Books up to date" value={CLIENTS.filter(c => c.openTasks === 0 && c.flag !== "archived").length}
                  sub="zero pending items" intent="positive" />
      </div>

      {/* Filter bar */}
      <Card className="mb-4">
        <div className="flex items-center gap-3 p-3 flex-wrap">
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-soft">{I.search}</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, industry, owner…"
              className="w-full h-8 pl-8 pr-3 rounded-md bg-card border border-border text-[13.5px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsTrigger value="all">All <span className="ml-1 font-mono tnum opacity-60">{counts.total}</span></TabsTrigger>
            <TabsTrigger value="active">Active <span className="ml-1 font-mono tnum opacity-60">{counts.active}</span></TabsTrigger>
            <TabsTrigger value="review">Review <span className="ml-1 font-mono tnum opacity-60">{counts.review}</span></TabsTrigger>
            <TabsTrigger value="archived">Archived <span className="ml-1 font-mono tnum opacity-60">{counts.archived}</span></TabsTrigger>
          </Tabs>

          <div className="flex-1" />

          <FilterChip label="Owner" value={ownerFilter === "all" ? "All" : ownerFilter}
                      onClick={() => {
                        const i = owners.indexOf(ownerFilter);
                        setOwnerFilter(owners[(i + 1) % owners.length]);
                      }} />
          <FilterChip label="Sort"  value={sortBy === "recent" ? "Recent" : sortBy === "name" ? "Name" : "Open tasks"}
                      onClick={() => {
                        const opts = ["recent", "name", "tasks"];
                        const i = opts.indexOf(sortBy);
                        setSortBy(opts[(i + 1) % opts.length]);
                      }} />
          <Button variant="ghost" size="icon">{I.filter}</Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <table className="w-full text-[13.5px]">
          <thead className="bg-muted/60 border-b border-border">
            <tr>
              <th className="text-left h-9 px-4 text-[11px] uppercase tracking-wider text-text-soft font-medium">Client</th>
              <th className="text-left h-9 px-3 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[140px]">Status</th>
              <th className="text-left h-9 px-3 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[180px]">Books health</th>
              <th className="text-right h-9 px-3 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[90px]">Open</th>
              <th className="text-left h-9 px-3 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[130px]">Owner</th>
              <th className="text-left h-9 px-3 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[110px]">Last activity</th>
              <th className="w-[60px]"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-muted-foreground">
                  <div className="text-foreground font-medium mb-1">No clients match this view</div>
                  <div className="text-[13px]">Adjust filters, or <button className="text-primary hover:underline" onClick={() => { setQ(""); setStatusFilter("all"); setOwnerFilter("all"); }}>clear all</button>.</div>
                </td>
              </tr>
            ) : sorted.map((c) => (
              <tr key={c.id}
                  className="border-b border-border/60 hover:bg-muted/60 cursor-pointer transition-colors group"
                  style={{ height: "var(--row-h, 56px)" }}>
                <td className="px-4 align-middle">
                  <div className="flex items-center gap-3">
                    <button className={cn("flex-shrink-0",
                                          c.pinned ? "text-warning" : "text-text-soft opacity-0 group-hover:opacity-100 hover:text-foreground")}
                            title={c.pinned ? "Unpin" : "Pin"}>
                      {c.pinned ? I.starOn : I.starOff}
                    </button>
                    <Avatar size={32}>{c.initials}</Avatar>
                    <div className="min-w-0">
                      <div className="font-medium text-foreground truncate">{c.name}</div>
                      <div className="text-[11px] text-text-soft truncate">
                        <span className="font-mono">{c.entity}</span>
                        <span className="mx-1.5">·</span>
                        <span>{c.industry}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 align-middle">
                  <StatusCell c={c} />
                </td>
                <td className="px-3 align-middle">
                  <BooksHealth c={c} />
                </td>
                <td className="px-3 align-middle text-right">
                  <span className={cn("font-mono tnum", c.openTasks === 0 ? "text-text-soft" : "text-foreground")}>
                    {c.openTasks === 0 ? "—" : c.openTasks}
                  </span>
                </td>
                <td className="px-3 align-middle">
                  <div className="flex items-center gap-2">
                    <AvatarRound size={22}>{c.owner.split(" ").map(s => s[0]).join("")}</AvatarRound>
                    <span className="text-[12.5px] text-muted-foreground">{c.owner}</span>
                  </div>
                </td>
                <td className="px-3 align-middle text-[12px] text-muted-foreground">{c.opened || "—"}</td>
                <td className="px-3 align-middle">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon-sm" title="Open"><span className="w-3.5 h-3.5 grid place-items-center">{I.chevRight}</span></Button>
                    <Button variant="ghost" size="icon-sm" title="More"><span className="w-3.5 h-3.5 grid place-items-center">{I.more}</span></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <CardFooter>
          <div className="flex items-center justify-between w-full">
            <span>Showing <span className="font-mono text-foreground">{sorted.length}</span> of <span className="font-mono text-foreground">{counts.total}</span> clients</span>
            <div className="flex items-center gap-3">
              <span>Press <Kbd>⌘</Kbd><Kbd>K</Kbd> to jump to any client</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
