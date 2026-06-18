import { useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardFooter,
  Badge,
  Button,
  Avatar,
  Sparkline,
} from "@accounting-completed/ui";
import { WORKLOAD_CLIENTS, ACTIVITY, DEADLINES } from "@accounting-completed/domain";
import type { ActivityItem, DeadlineItem, WorkloadClient } from "@accounting-completed/domain";
import { cn } from "@accounting-completed/utils";
import { ICONS } from "../../layout/icons";
import { StatTile } from "../../components/StatTile";

/* ---------- Activity feed ------------------------------------------------ */
const ACTIVITY_ICON: Record<
  ActivityItem["kind"],
  { bg: string; icon: React.ReactNode }
> = {
  approve:   { bg: "bg-positive/15 text-positive",        icon: ICONS.check },
  reconcile: { bg: "bg-accent text-accent-foreground",    icon: ICONS.check },
  system:    { bg: "bg-secondary text-muted-foreground",  icon: ICONS.refresh },
  comment:   { bg: "bg-info-soft text-info",              icon: ICONS.alert },
  close:     { bg: "bg-positive/15 text-positive",        icon: ICONS.check },
  rule:      { bg: "bg-accent text-accent-foreground",    icon: ICONS.zap },
  alert:     { bg: "bg-warning-soft text-warning",        icon: ICONS.alert },
};

function ActivityRow({ a }: { a: ActivityItem }) {
  const meta = ACTIVITY_ICON[a.kind] ?? ACTIVITY_ICON.system;
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

/* ---------- Deadlines list ----------------------------------------------- */
function DeadlineRow({ d }: { d: DeadlineItem }) {
  const [month, day] = d.date.split(" ");
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/60 last:border-b-0">
      <div
        className={cn(
          "w-10 flex-shrink-0 text-center py-0.5 rounded-md border",
          d.urgent
            ? "border-warning/40 bg-warning-soft text-warning"
            : "border-border bg-card text-muted-foreground"
        )}
      >
        <div className="text-[9.5px] uppercase tracking-wider leading-3">{month}</div>
        <div className="font-mono text-[14px] font-medium leading-4">{day}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium truncate">{d.label}</div>
        <div className="text-[11.5px] text-text-soft truncate">{d.client}</div>
      </div>
      <div className={cn("text-[11px] whitespace-nowrap mt-0.5", d.urgent ? "text-warning font-medium" : "text-text-soft")}>
        in {d.in}
      </div>
    </div>
  );
}

/* ---------- Workload row ------------------------------------------------- */
function WorkloadRow({ c }: { c: WorkloadClient }) {
  const isReview = c.flag === "needs-review";
  const isOpen = c.openTasks > 0;
  const urgency = isReview ? "needs-review" : isOpen ? "active" : "clean";

  return (
    <div className="flex items-center gap-3 px-4 h-14 border-b border-border/60 last:border-b-0 hover:bg-muted/60 transition-colors group">
      <Avatar name={c.name} size={32} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{c.name}</span>
          {urgency === "needs-review" && (
            <Badge variant="warning">{c.openTasks} to review</Badge>
          )}
          {urgency === "active" && (
            <Badge variant="info">{c.openTasks} open</Badge>
          )}
          {urgency === "clean" && (
            <Badge variant="positive">Up to date</Badge>
          )}
        </div>
        <div className="text-[11.5px] text-text-soft mt-0.5">
          <span className="font-mono">{c.entity}</span>
          <span className="mx-1.5">·</span>
          <span>{c.industry}</span>
          <span className="mx-1.5">·</span>
          <span>Owner: <span className="text-foreground/80">{c.owner}</span></span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {c.spark && (
          <Sparkline
            values={c.spark}
            width={84}
            height={24}
            color={isReview ? "hsl(var(--warning))" : "hsl(var(--primary))"}
          />
        )}
        <span className="text-[11.5px] text-text-soft w-16 text-right">{c.opened}</span>
        <span className="text-text-soft opacity-0 group-hover:opacity-100 transition-opacity">
          {ICONS.chevRight}
        </span>
      </div>
    </div>
  );
}

/* ---------- Page --------------------------------------------------------- */
type WorkloadFilter = "priority" | "mine" | "review";

export function DashboardPage() {
  const [filter, setFilter] = useState<WorkloadFilter>("priority");

  const stats = useMemo(() => {
    const active = WORKLOAD_CLIENTS.filter(c => c.flag !== "archived");
    return {
      tasks:    active.reduce((s, c) => s + c.openTasks, 0),
      review:   active.filter(c => c.flag === "needs-review").length,
      clean:    active.filter(c => c.openTasks === 0 && c.flag !== "archived").length,
      mine:     active.filter(c => c.owner === "Scott T.").length,
      newFeeds: 7,
    };
  }, []);

  const workload = useMemo(() => {
    const active = WORKLOAD_CLIENTS.filter(c => c.flag !== "archived");
    let list = active;
    if (filter === "mine")   list = list.filter(c => c.owner === "Scott T.");
    if (filter === "review") list = list.filter(c => c.flag === "needs-review");
    return [...list]
      .sort((a, b) => {
        const score = (c: WorkloadClient) =>
          (c.flag === "needs-review" ? 1000 : 0) + c.openTasks * 10 + (c.pinned ? 1 : 0);
        return score(b) - score(a);
      })
      .slice(0, 10);
  }, [filter]);

  const filterOpts: { v: WorkloadFilter; l: string }[] = [
    { v: "priority", l: "Priority" },
    { v: "mine",     l: "Assigned to me" },
    { v: "review",   l: "Review only" },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="mb-6 flex items-end justify-between gap-6 flex-wrap">
        <div>
          <div className="text-[12px] text-text-soft font-medium uppercase tracking-wider mb-1">
            Thursday · May 28
          </div>
          <h1 className="text-[32px] leading-[1.1] font-semibold tracking-tight m-0">
            Good morning, Scott.
          </h1>
          <p
            className="text-[15px] text-muted-foreground mt-2 max-w-[60ch]"
            style={{ textWrap: "pretty" } as React.CSSProperties}
          >
            You have{" "}
            <span className="text-foreground font-medium font-mono tnum">{stats.tasks}</span>{" "}
            open items across{" "}
            <span className="text-foreground font-medium font-mono tnum">{stats.mine}</span>{" "}
            clients.{" "}
            <span className="text-warning font-medium">{stats.review} clients need review today.</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button>{ICONS.refresh}<span>Refresh feeds</span></Button>
          <Button>{ICONS.plus}<span>Quick journal entry</span></Button>
          <Button variant="primary">{ICONS.plus}<span>Add client</span></Button>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatTile
          label="Needs review"
          value={stats.review}
          sub="awaiting your action"
          intent="warning"
        />
        <StatTile
          label="Open tasks"
          value={stats.tasks}
          sub="across all my clients"
          intent="accent"
        />
        <StatTile
          label="New bank items"
          value={stats.newFeeds}
          sub="imported overnight"
        />
        <StatTile
          label="Books up to date"
          value={stats.clean}
          sub="zero pending items"
          intent="positive"
        />
      </div>

      {/* Two-column main */}
      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 380px" }}>
        {/* Left: Workload */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle>Your workload</CardTitle>
              <span className="text-[12.5px] text-muted-foreground">prioritized for today</span>
            </div>
            <div className="flex items-center gap-1 bg-muted border border-border rounded-md p-[3px]">
              {filterOpts.map(opt => (
                <button
                  key={opt.v}
                  onClick={() => setFilter(opt.v)}
                  className={cn(
                    "h-6 px-3 rounded text-[12px] font-medium transition-colors whitespace-nowrap",
                    filter === opt.v
                      ? "bg-card text-foreground shadow-elev-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </CardHeader>

          <div className="divide-y divide-border/60">
            {workload.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                No clients match this view.
              </div>
            ) : (
              workload.map(c => <WorkloadRow key={c.id} c={c} />)
            )}
          </div>

          <CardFooter>
            <div className="flex items-center justify-between w-full">
              <span className="text-[12.5px] text-muted-foreground">
                Showing top{" "}
                <span className="font-mono text-foreground">{workload.length}</span>
                {" · "}
                <a href="/setup/clients" className="text-primary hover:underline">
                  See all clients →
                </a>
              </span>
              <span className="text-[12.5px] text-muted-foreground">
                Updated <span className="font-mono text-foreground">just now</span>
              </span>
            </div>
          </CardFooter>
        </Card>

        {/* Right column */}
        <div className="flex flex-col gap-6 min-w-0">
          {/* Deadlines */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Upcoming deadlines</CardTitle>
              <a href="#" className="text-[12px] text-primary hover:underline">Calendar →</a>
            </CardHeader>
            <div className="px-5 py-2">
              {DEADLINES.map((d, i) => (
                <DeadlineRow key={i} d={d} />
              ))}
            </div>
          </Card>

          {/* Activity feed */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Activity</CardTitle>
              <a href="#" className="text-[12px] text-primary hover:underline">All →</a>
            </CardHeader>
            <div className="px-5 py-2">
              {ACTIVITY.map((a, i) => (
                <ActivityRow key={i} a={a} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
