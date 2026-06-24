import {
  Card,
  CardHeader,
  CardTitle,
  CardFooter,
  Button,
  Avatar,
} from "@accounting-completed/ui";
import { useMe, useClients } from "@accounting-completed/api-client";
import type { ClientSummary } from "@accounting-completed/contracts";
import { ICONS } from "../../layout/icons";
import { firstName } from "../../app/user-display";

/* ---------- Empty state -------------------------------------------------- */
function EmptyState({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="px-5 py-10 text-center">
      <div className="text-foreground text-[13.5px] font-medium">{title}</div>
      <div className="text-[12.5px] text-text-soft mt-1">{sub}</div>
    </div>
  );
}

/* ---------- Client row --------------------------------------------------- */
function ClientRow({ c }: { c: ClientSummary }) {
  return (
    <div className="flex items-center gap-3 px-4 h-14 border-b border-border/60 last:border-b-0 hover:bg-muted/60 transition-colors group">
      <Avatar name={c.name} size={32} />
      <div className="flex-1 min-w-0">
        <span className="font-medium truncate">{c.name}</span>
      </div>
      <span className="text-text-soft opacity-0 group-hover:opacity-100 transition-opacity">
        {ICONS.chevRight}
      </span>
    </div>
  );
}

/* ---------- Greeting ----------------------------------------------------- */
function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/* ---------- Page --------------------------------------------------------- */
export function DashboardPage() {
  const { data: me } = useMe();
  const isStaff = me?.roles?.isStaff ?? false;
  const { data: clients, isLoading: clientsLoading } = useClients({ enabled: isStaff });

  const now = new Date();
  const greeting = greetingFor(now.getHours());
  const name = firstName(me);
  const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = now.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  const clientCount = clients?.length ?? 0;
  const subtitle = clientsLoading
    ? "Loading your clients…"
    : clientCount > 0
      ? `You're managing ${clientCount} ${clientCount === 1 ? "client" : "clients"}.`
      : "No clients yet.";

  return (
    <div>
      {/* Hero */}
      <div className="mb-6 flex items-end justify-between gap-6 flex-wrap">
        <div>
          <div className="text-[12px] text-text-soft font-medium uppercase tracking-wider mb-1">
            {weekday} · {monthDay}
          </div>
          <h1 className="text-[32px] leading-[1.1] font-semibold tracking-tight m-0">
            {greeting}{name ? `, ${name}` : ""}.
          </h1>
          <p
            className="text-[15px] text-muted-foreground mt-2 max-w-[60ch]"
            style={{ textWrap: "pretty" } as React.CSSProperties}
          >
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary">{ICONS.plus}<span>Add client</span></Button>
        </div>
      </div>

      {/* Two-column main */}
      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 380px" }}>
        {/* Left: Clients */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Your clients</CardTitle>
            <a href="/setup/clients" className="text-[12px] text-primary hover:underline">
              All clients →
            </a>
          </CardHeader>

          <div className="divide-y divide-border/60">
            {clientsLoading ? (
              <div className="p-10 text-center text-muted-foreground text-[13.5px]">Loading clients…</div>
            ) : clientCount === 0 ? (
              <EmptyState title="No clients yet" sub="Clients you manage will appear here." />
            ) : (
              (clients ?? []).map((c) => <ClientRow key={c.id} c={c} />)
            )}
          </div>

          {clientCount > 0 && (
            <CardFooter>
              <span className="text-[12.5px] text-muted-foreground">
                <span className="font-mono text-foreground">{clientCount}</span>{" "}
                {clientCount === 1 ? "client" : "clients"}
              </span>
            </CardFooter>
          )}
        </Card>

        {/* Right column */}
        <div className="flex flex-col gap-6 min-w-0">
          {/* Deadlines */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Upcoming deadlines</CardTitle>
            </CardHeader>
            <EmptyState title="No upcoming deadlines" sub="Deadlines will appear here once scheduled." />
          </Card>

          {/* Activity feed */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <EmptyState title="No recent activity" sub="Recent changes across your clients will appear here." />
          </Card>
        </div>
      </div>
    </div>
  );
}
