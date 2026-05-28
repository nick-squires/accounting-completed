/* global React, Button, AvatarRound, Avatar, Input, Kbd, cn */
/* MAC · App shell — icons, role-aware Sidebar, Topbar with role chip. */

const Icn = ({ d, size = 16, fill = "none", stroke = "currentColor", sw = 1.6, className }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

const I = {
  dash:      <Icn d={<><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></>} />,
  pl:        <Icn d={<><path d="M3 3v18h18"/><path d="M7 14l4-5 4 3 5-7"/></>} />,
  balance:   <Icn d={<><path d="M12 3v18"/><path d="M5 7h14"/><path d="M3 12c2 4 4 4 6 4s4 0 6-4"/><path d="M9 12c2 4 4 4 6 4s4 0 6-4"/></>} />,
  ledger:    <Icn d={<><path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4Z"/><path d="M8 8h8M8 12h8M8 16h5"/></>} />,
  txns:      <Icn d={<><path d="M3 7h14l-3-3"/><path d="M21 17H7l3 3"/></>} />,
  accounts:  <Icn d={<><path d="M3 6h18M3 12h18M3 18h18"/><circle cx="6" cy="6" r="1" fill="currentColor"/><circle cx="10" cy="12" r="1" fill="currentColor"/><circle cx="14" cy="18" r="1" fill="currentColor"/></>} />,
  bank:      <Icn d={<><path d="M3 10l9-6 9 6"/><path d="M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/></>} />,
  cats:      <Icn d={<><path d="M3 7l9-4 9 4-9 4-9-4Z"/><path d="M3 12l9 4 9-4M3 17l9 4 9-4"/></>} />,
  clients:   <Icn d={<><circle cx="9" cy="9" r="3"/><path d="M3 19c0-3 2.5-5 6-5s6 2 6 5"/><circle cx="17" cy="8" r="2"/><path d="M21 18c0-2-1.5-3.5-4-3.5"/></>} />,
  staff:     <Icn d={<><circle cx="12" cy="8" r="3"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></>} />,
  reports:   <Icn d={<><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></>} />,
  settings:  <Icn d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></>} />,
  cal:       <Icn d={<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></>} />,
  search:    <Icn d={<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>} size={14} />,
  chevDown:  <Icn d={<polyline points="6 9 12 15 18 9"/>} size={14} />,
  chevRight: <Icn d={<polyline points="9 6 15 12 9 18"/>} size={14} />,
  chevUpDown:<Icn d={<><polyline points="7 9 12 4 17 9"/><polyline points="7 15 12 20 17 15"/></>} size={14} />,
  arrowUp:   <Icn d={<><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></>} size={12} sw={2} />,
  arrowDown: <Icn d={<><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></>} size={12} sw={2} />,
  refresh:   <Icn d={<><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><polyline points="21 3 21 8 16 8"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><polyline points="3 21 3 16 8 16"/></>} />,
  download:  <Icn d={<><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></>} />,
  print:     <Icn d={<><path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="1"/><path d="M6 17h12v4H6z"/></>} />,
  more:      <Icn d={<><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/></>} />,
  filter:    <Icn d={<path d="M3 5h18l-7 9v6l-4-2v-4Z"/>} />,
  share:     <Icn d={<><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8 11 8-4M8 13l8 4"/></>} />,
  zap:       <Icn d={<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/>} />,
  trend:     <Icn d={<><path d="M3 17 9 11l4 4 8-9"/><polyline points="14 6 21 6 21 13"/></>} size={14} />,
  bell:      <Icn d={<><path d="M6 8a6 6 0 0 1 12 0c0 6 2 8 2 8H4s2-2 2-8Z"/><path d="M10 21a2 2 0 0 0 4 0"/></>} />,
  plus:      <Icn d={<><path d="M12 5v14M5 12h14"/></>} sw={1.8} />,
  check:     <Icn d={<polyline points="20 6 9 17 4 12"/>} sw={2} size={14} />,
  x:         <Icn d={<><path d="M18 6 6 18M6 6l12 12"/></>} />,
  pin:       <Icn d={<><path d="M12 17v5"/><path d="M9 12v5h6v-5"/><path d="m9 12 2-9h2l2 9"/></>} size={14} />,
  alert:     <Icn d={<><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/></>} />,
  link:      <Icn d={<><path d="M10 14a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 10a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/></>} size={14} />,
  starOff:   <Icn d={<path d="M11 3.5 13.4 8.5l5.5.5-4.2 3.6 1.3 5.4L11 15.3 6 18l1.3-5.4L3.1 9l5.5-.5Z"/>} size={14} />,
  starOn:    <Icn d={<path d="M11 3.5 13.4 8.5l5.5.5-4.2 3.6 1.3 5.4L11 15.3 6 18l1.3-5.4L3.1 9l5.5-.5Z"/>} size={14} fill="currentColor" />,
  cmd:       <Icn d={<path d="M6 6a2 2 0 1 1 4 0v12a2 2 0 1 1-4 0M14 6a2 2 0 1 1 4 0v12a2 2 0 1 1-4 0M6 10h12M6 14h12"/>} size={12} />,
  health:    <Icn d={<><path d="M3 12h4l2-5 4 10 2-5h6"/></>} />,
  approve:   <Icn d={<><path d="M9 11l3 3 7-7"/><path d="M21 12a9 9 0 1 1-3.2-6.9"/></>} />,
  card:      <Icn d={<><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h2M11 15h2"/></>} />,
};

/* Role definitions ---------------------------------------------------- */
const ROLES = {
  staff: {
    label: "Firm staff",
    user:  { name: "Jordan Reyes",   role: "Senior bookkeeper", initials: "JR" },
    firm:  "Acme Bookkeeping Co.",
    canSwitchClient: true,
  },
  owner: {
    label: "Business owner",
    user:  { name: "Diego Marín",    role: "Owner & founder",   initials: "DM" },
    firm:  null,
    canSwitchClient: false,
  },
  employee: {
    label: "Employee",
    user:  { name: "Sam Park",       role: "Bookkeeper",        initials: "SP" },
    firm:  null,
    canSwitchClient: false,
  },
};

/* Nav items + role visibility ---------------------------------------- */
const NAV = [
  { key: "dash",      label: "Dashboard",        icon: I.dash,     group: "top",     href: "Dashboard.html",            roles: ["staff", "owner", "employee"] },
  { key: "txns",      label: "Transactions",     icon: I.txns,     group: "top",     href: "Manage Transactions.html",  roles: ["staff", "owner", "employee"], count: 42 },
  { key: "bank",      label: "Bank feeds",       icon: I.bank,     group: "top",     href: "Bank Feeds.html",           roles: ["staff", "owner"] },

  { key: "pl",        label: "Profit & Loss",    icon: I.pl,       group: "reports", href: "Profit %26 Loss.html",      roles: ["staff", "owner", "employee"] },
  { key: "balance",   label: "Balance Sheet",    icon: I.balance,  group: "reports", href: "Balance Sheet.html",        roles: ["staff", "owner"] },
  { key: "ledger",    label: "General Ledger",   icon: I.ledger,   group: "reports", href: "General Ledger.html",       roles: ["staff", "owner"] },
  { key: "journal",   label: "General Journal",  icon: I.reports,  group: "reports", href: "General Journal.html",      roles: ["staff", "owner"] },
  { key: "approve",   label: "Approve reports",  icon: I.approve,  group: "reports", href: "Approve Report.html",       roles: ["staff", "owner"], count: 3 },

  { key: "coa",       label: "Chart of accounts",icon: I.accounts, group: "setup",   href: "Chart of Accounts.html",    roles: ["staff", "owner"] },
  { key: "cats",      label: "Categories",       icon: I.cats,     group: "setup",   href: "Categories.html",           roles: ["staff", "owner"] },
  { key: "clients",   label: "Clients",          icon: I.clients,  group: "setup",   href: "Clients.html",              roles: ["staff"], count: 28 },
  { key: "staff",     label: "Staff & roles",    icon: I.staff,    group: "setup",   href: "Staff %26 Roles.html",      roles: ["staff", "owner"] },
  { key: "settings",  label: "Settings",         icon: I.settings, group: "setup",   href: "Settings.html",             roles: ["staff", "owner"] },

  { key: "plans",     label: "Plans & billing",  icon: I.card,     group: "account", href: "Plans.html",                roles: ["owner"] },

  { key: "health",    label: "System health",    icon: I.health,   group: "admin",   href: "System Health.html",        roles: ["staff"] },
];

const GROUPS = [
  { key: "top",     label: null,       roles: ["staff", "owner", "employee"] },
  { key: "reports", label: "Reports",  roles: ["staff", "owner", "employee"] },
  { key: "setup",   label: "Setup",    roles: ["staff", "owner"] },
  { key: "account", label: "Account",  roles: ["owner"] },
  { key: "admin",   label: "Admin",    roles: ["staff"] },
];

const ROLE_PILL = {
  staff:    { label: "Firm staff",     cls: "bg-primary/15 text-primary" },
  owner:    { label: "Business owner", cls: "bg-positive/15 text-positive" },
  employee: { label: "Employee",       cls: "bg-info/15 text-info" },
};

/* =========================================================
   Sidebar
   ========================================================= */
function Sidebar({ activeKey = "pl",
                   role = "staff",
                   clientName = "Atlas Coffee Roasters",
                   clientInitials = "AC",
                   clientSub = "FY 2026 · QBO synced",
                   onClientClick }) {
  const r = ROLES[role] || ROLES.staff;
  const items = NAV.filter(n => n.roles.includes(role));
  const groups = GROUPS.filter(g => g.roles.includes(role) && items.some(it => it.group === g.key));

  return (
    <aside className="w-[240px] flex flex-col bg-sidebar border-r border-sidebar-border overflow-hidden">
      {/* Brand */}
      <div className="h-14 flex items-center gap-2 px-4 border-b border-border/60 flex-shrink-0">
        <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground grid place-items-center font-mono font-semibold text-[10px] tracking-tight">AC</div>
        <div className="leading-tight">
          <div className="font-semibold text-[15px] tracking-tight">Accounting Completed</div>
          <div className="text-[10px] text-text-soft tracking-wider uppercase">
            {r.firm || "Cloud Accounting"}
          </div>
        </div>
      </div>

      {/* Client switcher / brand panel */}
      {r.canSwitchClient ? (
        <button
          onClick={onClientClick}
          type="button"
          className="mx-3 mt-3 px-3 py-2.5 flex items-center gap-3 bg-muted border border-border rounded-md hover:bg-secondary hover:border-border-strong transition-colors text-left">
          <Avatar size={32} className="text-[12px]">{clientInitials}</Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-[13.5px] font-medium truncate">{clientName}</div>
            <div className="text-[11px] text-text-soft truncate">{clientSub}</div>
          </div>
          <span className="text-text-soft flex-shrink-0">{I.chevUpDown}</span>
        </button>
      ) : (
        <div className="mx-3 mt-3 px-3 py-2.5 flex items-center gap-3 bg-muted border border-border rounded-md">
          <Avatar size={32} className="text-[12px]">{clientInitials}</Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-[13.5px] font-medium truncate">{clientName}</div>
            <div className="text-[11px] text-text-soft truncate">{clientSub}</div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 flex flex-col">
        {groups.map((g) => (
          <div key={g.key} className="mb-4">
            {g.label && (
              <div className="px-3 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-text-soft">
                {g.label}
              </div>
            )}
            {items.filter(it => it.group === g.key).map((it) => {
              const active = it.key === activeKey;
              const inner = (
                <>
                  <span className="w-4 h-4 flex-shrink-0 grid place-items-center">{it.icon}</span>
                  <span className="flex-1">{it.label}</span>
                  {it.count !== undefined && (
                    <span className={cn("text-[11px] tnum font-mono", active ? "text-primary" : "text-text-soft")}>
                      {it.count}
                    </span>
                  )}
                </>
              );
              const cls = cn(
                "flex items-center gap-3 px-3 h-8 rounded-md text-[13.5px] transition-colors cursor-pointer",
                active
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              );
              return it.href
                ? <a key={it.key} className={cls} href={it.href}>{inner}</a>
                : <div key={it.key} className={cls}>{inner}</div>;
            })}
          </div>
        ))}

        <div className="mt-auto">
          <a className="flex items-center gap-3 px-3 h-8 rounded-md text-[13.5px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
             href="Design System.html">
            <span className="w-4 h-4 flex-shrink-0 grid place-items-center">{I.zap}</span>
            <span>Design system</span>
          </a>
        </div>
      </nav>

      {/* Footer / user */}
      <div className="border-t border-border/60 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <AvatarRound size={28}>{r.user.initials}</AvatarRound>
        <div className="flex-1 min-w-0 leading-tight">
          <div className="text-[13px] font-medium truncate">{r.user.name}</div>
          <div className="text-[11px] text-text-soft truncate">{r.user.role}</div>
        </div>
        <Button variant="ghost" size="icon-sm" title="Notifications">
          <span className="w-4 h-4 grid place-items-center">{I.bell}</span>
        </Button>
      </div>
    </aside>
  );
}

/* =========================================================
   Topbar — role chip
   ========================================================= */
function Topbar({ crumbs = [], role = "staff", children }) {
  const pill = ROLE_PILL[role] || ROLE_PILL.staff;
  return (
    <div className="h-14 bg-card border-b border-border flex items-center px-6 gap-4 flex-shrink-0">
      <div className="flex items-center gap-2 text-[13.5px] text-muted-foreground">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-border-strong">{I.chevRight}</span>}
            <span className={i === crumbs.length - 1 ? "text-foreground font-medium" : ""}>{c}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="flex-1" />
      <div className="relative w-[260px]">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-soft">{I.search}</span>
        <input
          placeholder="Search anything…"
          className="w-full h-8 pl-8 pr-12 rounded-md bg-muted border border-border text-[13.5px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 focus:bg-card"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2"><Kbd>⌘K</Kbd></span>
      </div>
      {/* Role chip */}
      <div className={cn("inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11.5px] font-medium whitespace-nowrap", pill.cls)}>
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
        Viewing as {pill.label}
      </div>
      {children}
      <Button variant="ghost" size="icon" title="Notifications">
        <span className="relative w-4 h-4 grid place-items-center">
          {I.bell}
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-destructive ring-2 ring-card" />
        </span>
      </Button>
    </div>
  );
}

Object.assign(window, { Icn, I, Sidebar, Topbar, ROLES, NAV });
