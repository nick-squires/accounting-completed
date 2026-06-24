import {
  Card,
  CardHeader,
  CardTitle,
  Button,
  DataTable,
} from "@accounting-completed/ui";
import { useMe, useClients } from "@accounting-completed/api-client";
import { ICONS } from "../../layout/icons";
import { firstName } from "../../app/user-display";
import { compactClientColumns } from "../clients/clientColumns";

/* ---------- Empty state -------------------------------------------------- */
function EmptyState({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="px-5 py-10 text-center">
      <div className="text-foreground text-[13.5px] font-medium">{title}</div>
      <div className="text-[12.5px] text-text-soft mt-1">{sub}</div>
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
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Your clients</CardTitle>
            <a href="/setup/clients" className="text-[12px] text-primary hover:underline">
              All clients →
            </a>
          </CardHeader>

          <DataTable
            data={clients ?? []}
            columns={compactClientColumns}
            getRowKey={(c) => c.id}
            pageSize={6}
            searchPlaceholder="Search clients…"
            isLoading={isStaff && clientsLoading}
            loadingState="Loading clients…"
            emptyState={<EmptyState title="No clients yet" sub="Clients you manage will appear here." />}
          />
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
