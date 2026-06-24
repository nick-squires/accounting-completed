import { Avatar, Badge, type DataTableColumn } from "@accounting-completed/ui";
import type { ClientSummary } from "@accounting-completed/contracts";

function formatSince(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status?: ClientSummary["status"] }) {
  return status === "verified" ? (
    <Badge variant="positive">Verified</Badge>
  ) : (
    <Badge variant="warning">Unverified</Badge>
  );
}

const Muted = ({ value }: { value?: string | null }) =>
  value ? <span className="text-muted-foreground">{value}</span> : <span className="text-text-soft">—</span>;

/** Column definitions for a client row, keyed by id so pages can pick a subset. */
const col: Record<string, DataTableColumn<ClientSummary>> = {
  client: {
    id: "client",
    header: "Client",
    searchText: (c) => c.name,
    cell: (c) => (
      <div className="flex items-center gap-3 min-w-0">
        <Avatar name={c.name} size={32} />
        <span className="font-medium truncate">{c.name}</span>
      </div>
    ),
  },
  email: {
    id: "email",
    header: "Email",
    searchText: (c) => c.email ?? "",
    cell: (c) => <Muted value={c.email} />,
  },
  location: {
    id: "location",
    header: "Location",
    searchText: (c) => c.location ?? "",
    cell: (c) => <Muted value={c.location} />,
  },
  since: {
    id: "since",
    header: "Client since",
    cell: (c) => <span className="text-muted-foreground tabular-nums">{formatSince(c.createdAt)}</span>,
  },
  status: {
    id: "status",
    header: "Status",
    headerClassName: "w-[120px]",
    cell: (c) => <StatusBadge status={c.status} />,
  },
};

/** Full table — the Clients page. */
export const fullClientColumns: DataTableColumn<ClientSummary>[] = [
  col.client,
  col.email,
  col.location,
  col.since,
  col.status,
];

/** Slim table — the dashboard card. */
export const compactClientColumns: DataTableColumn<ClientSummary>[] = [col.client, col.email, col.status];
