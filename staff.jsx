/* global React, ReactDOM, PageShell, PageHeader, StatTile, Button, Badge, Card, CardHeader, CardTitle,
            CardFooter, Tabs, TabsTrigger, AvatarRound, cn, I */

const { useState, useMemo } = React;

const STAFF = [
  { id: "u1", name: "Scott Turner",      initials: "ST", email: "scott@recordsinorder.com",    role: "Senior bookkeeper", clients: 8,  lastActive: "Online now",  twofa: true,  status: "active",  joined: "Jan 2023" },
  { id: "u2", name: "Priya Sharma",      initials: "PS", email: "priya@recordsinorder.com",     role: "Senior bookkeeper", clients: 7,  lastActive: "12m ago",     twofa: true,  status: "active",  joined: "Mar 2023" },
  { id: "u3", name: "Marcus Tran",       initials: "MT", email: "marcus@recordsinorder.com",    role: "Bookkeeper",        clients: 9,  lastActive: "1h ago",      twofa: true,  status: "active",  joined: "Aug 2024" },
  { id: "u4", name: "Adelina Costa",     initials: "AC", email: "adelina@recordsinorder.com",   role: "Firm admin",        clients: 28, lastActive: "Yesterday",   twofa: true,  status: "active",  joined: "Founder" },
  { id: "u5", name: "Lou Whitaker",      initials: "LW", email: "lou@recordsinorder.com",       role: "Bookkeeper",        clients: 4,  lastActive: "2d ago",      twofa: false, status: "active",  joined: "Jan 2026" },
  { id: "u6", name: "Sara Ng",           initials: "SN", email: "sara.ng@recordsinorder.com",   role: "Read-only",         clients: 12, lastActive: "3d ago",      twofa: true,  status: "active",  joined: "Apr 2026" },
  { id: "u7", name: "Henry Cole",        initials: "HC", email: "henry@recordsinorder.com",     role: "Bookkeeper",        clients: 0,  lastActive: "Never",       twofa: false, status: "pending", joined: "Invited 2d ago" },
  { id: "u8", name: "Tomas Iverson",     initials: "TI", email: "tomas@former.co",        role: "Bookkeeper",        clients: 0,  lastActive: "4mo ago",     twofa: true,  status: "inactive",joined: "Left Feb 2026" },
];

const ROLES = [
  { name: "Firm admin", count: 1, color: "bg-destructive/15 text-destructive",
    desc: "Manages billing, integrations, staff, and roles. Full access to every client.",
    perms: ["Manage staff & roles", "Manage billing & subscriptions", "Manage integrations", "Access all clients", "Close periods", "Approve journal entries"] },
  { name: "Senior bookkeeper", count: 2, color: "bg-primary/15 text-primary",
    desc: "Reviews and approves work, closes periods, manages client books across assigned clients.",
    perms: ["Approve transactions & JEs", "Close periods", "Manage chart of accounts", "Edit assigned clients", "Invite clients"] },
  { name: "Bookkeeper", count: 3, color: "bg-info/15 text-info",
    desc: "Day-to-day categorization, reconciliation, and report preparation on assigned clients.",
    perms: ["Categorize transactions", "Create journal entries (drafts)", "Reconcile bank statements", "Run reports", "Edit assigned clients"] },
  { name: "Read-only", count: 1, color: "bg-secondary text-muted-foreground",
    desc: "Can view books and reports across assigned clients, but cannot modify anything.",
    perms: ["View reports", "View transactions", "Export data"] },
];

const STATUS_MAP = {
  active:   { label: "Active",   variant: "positive", dot: true },
  pending:  { label: "Invite pending", variant: "warning", dot: true },
  inactive: { label: "Inactive", variant: "default" },
};

/* ---------- App ---------- */
function App() {
  const [tab, setTab] = useState("staff");

  const stats = useMemo(() => ({
    total: STAFF.length,
    active: STAFF.filter(u => u.status === "active").length,
    pending: STAFF.filter(u => u.status === "pending").length,
    no2fa: STAFF.filter(u => !u.twofa && u.status === "active").length,
  }), []);

  return (
    <PageShell activeKey="staff" crumbs={["Setup", "Staff & roles"]}>
      <PageHeader
        title="Staff & roles"
        sub={<><span className="font-mono text-foreground font-medium">{stats.active}</span> active staff at <span className="text-foreground">Records in Order</span></>}
        actions={
          <>
            <Button>{I.download}<span>Audit log</span></Button>
            <Button>{I.zap}<span>SSO settings</span></Button>
            <Button variant="primary">{I.plus}<span>Invite staff</span></Button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatTile label="Active staff" value={stats.active} sub={`${stats.pending} pending invites`} />
        <StatTile label="Firm admins" value={ROLES[0].count} sub="full firm access" intent="accent" />
        <StatTile label="Clients per staff" value="3.5" sub="average workload" intent="positive" />
        <StatTile label="Without 2FA" value={stats.no2fa} sub="security risk" intent={stats.no2fa > 0 ? "warning" : "positive"} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsTrigger value="staff">Staff <span className="ml-1 font-mono tnum opacity-60">{stats.total}</span></TabsTrigger>
        <TabsTrigger value="roles">Roles & permissions <span className="ml-1 font-mono tnum opacity-60">{ROLES.length}</span></TabsTrigger>
        <TabsTrigger value="invites">Pending invites <span className="ml-1 font-mono tnum opacity-60">{stats.pending}</span></TabsTrigger>
      </Tabs>

      <div className="mt-4">
        {tab === "staff" && (
          <Card>
            <table className="w-full text-[13.5px]">
              <thead className="bg-muted/60 border-b border-border">
                <tr>
                  <th className="text-left px-4 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium">Person</th>
                  <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[180px]">Role</th>
                  <th className="text-right px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[110px]">Clients</th>
                  <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[140px]">Last active</th>
                  <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[110px]">2FA</th>
                  <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[150px]">Status</th>
                  <th className="w-[60px]"></th>
                </tr>
              </thead>
              <tbody>
                {STAFF.map(u => {
                  const s = STATUS_MAP[u.status];
                  const role = ROLES.find(r => r.name === u.role);
                  return (
                    <tr key={u.id} className="border-b border-border/60 hover:bg-muted/60 transition-colors group cursor-pointer"
                        style={{ height: 60 }}>
                      <td className="px-4 align-middle">
                        <div className="flex items-center gap-3">
                          <AvatarRound size={36}>{u.initials}</AvatarRound>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{u.name}</div>
                            <div className="text-[11.5px] text-text-soft truncate">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 align-middle">
                        <span className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] font-medium", role?.color || "bg-secondary text-muted-foreground")}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-3 align-middle text-right">
                        {u.clients > 0 ? (
                          <span className="font-mono tnum">{u.clients}</span>
                        ) : (
                          <span className="text-text-soft text-[12px]">â€”</span>
                        )}
                      </td>
                      <td className="px-3 align-middle text-[12.5px] text-muted-foreground">
                        {u.lastActive === "Online now" ? (
                          <span className="inline-flex items-center gap-1.5 text-positive font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-positive"></span>
                            Online now
                          </span>
                        ) : u.lastActive}
                      </td>
                      <td className="px-3 align-middle">
                        {u.twofa ? (
                          <span className="inline-flex items-center gap-1 text-positive text-[12px] font-medium">
                            <span className="w-3 h-3">{I.check}</span> Enabled
                          </span>
                        ) : u.status === "active" ? (
                          <span className="inline-flex items-center gap-1 text-warning text-[12px] font-medium">
                            <span className="w-3 h-3">{I.alert}</span> Required
                          </span>
                        ) : (
                          <span className="text-text-soft text-[12px]">â€”</span>
                        )}
                      </td>
                      <td className="px-3 align-middle">
                        <Badge variant={s.variant} dot={s.dot}>{s.label}</Badge>
                      </td>
                      <td className="px-3 align-middle">
                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon-sm" variant="ghost">{I.more}</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <CardFooter>
              <div className="flex items-center justify-between w-full">
                <span>Showing <span className="font-mono text-foreground">{STAFF.length}</span> people Â· paying for <span className="font-mono text-foreground">6 seats</span></span>
                <a href="#" className="text-primary hover:underline">Manage seats â†’</a>
              </div>
            </CardFooter>
          </Card>
        )}

        {tab === "roles" && (
          <div className="grid grid-cols-2 gap-4">
            {ROLES.map(r => (
              <Card key={r.name}>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium", r.color)}>
                      {r.name}
                    </span>
                    <span className="text-[12px] text-text-soft"><span className="font-mono tnum text-foreground">{r.count}</span> {r.count === 1 ? "person" : "people"}</span>
                  </div>
                  <p className="text-[13px] text-muted-foreground mb-4" style={{ textWrap: "pretty" }}>{r.desc}</p>
                  <div className="space-y-2">
                    <div className="text-[11px] uppercase tracking-wider text-text-soft font-medium">Permissions</div>
                    <ul className="space-y-1.5">
                      {r.perms.map(p => (
                        <li key={p} className="flex items-center gap-2 text-[12.5px]">
                          <span className="w-3 h-3 text-positive flex-shrink-0">{I.check}</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between">
                    <Button size="sm" variant="ghost">Manage members</Button>
                    <Button size="sm" variant="ghost">Edit permissions</Button>
                  </div>
                </div>
              </Card>
            ))}
            <Card className="border-dashed">
              <button className="p-5 w-full text-left flex items-start gap-3 hover:bg-muted/40 transition-colors">
                <div className="w-9 h-9 rounded-md bg-secondary text-text-soft grid place-items-center flex-shrink-0">
                  <span className="w-4 h-4">{I.plus}</span>
                </div>
                <div>
                  <div className="font-semibold">Create custom role</div>
                  <div className="text-[12.5px] text-muted-foreground mt-0.5">Mix permissions for a specific workflow â€” e.g. tax-prep-only, AR clerk.</div>
                </div>
              </button>
            </Card>
          </div>
        )}

        {tab === "invites" && (
          <Card>
            <div className="p-10 text-center text-muted-foreground">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-warning-soft text-warning grid place-items-center">
                <span className="w-5 h-5">{I.link}</span>
              </div>
              <div className="text-foreground font-medium mb-1">{stats.pending} pending invite</div>
              <div className="text-[13px]">Henry Cole was invited 2 days ago and hasn't accepted yet.</div>
              <div className="mt-4 flex justify-center gap-2">
                <Button size="sm" variant="ghost">Resend invite</Button>
                <Button size="sm">Copy link</Button>
                <Button size="sm" variant="ghost">Revoke</Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
