import { NavLink } from "react-router-dom";
import { CLIENTS, navForRole, ROLES } from "@accounting-completed/domain";
import { Avatar, AvatarRound, Button } from "@accounting-completed/ui";
import { useRole } from "../app/role-context";
import { useClient } from "../app/client-context";
import { ICONS } from "./icons";

interface SidebarProps {
  onClientClick?: () => void;
}

export function Sidebar({ onClientClick }: SidebarProps) {
  const { role } = useRole();
  const { clientId } = useClient();
  const r = ROLES[role] ?? ROLES.staff;
  const client = CLIENTS.find((c) => c.id === clientId) ?? CLIENTS[0];
  const groups = navForRole(role);

  return (
    <aside className="w-[240px] flex flex-col bg-sidebar border-r border-sidebar-border overflow-hidden">
      {/* Brand */}
      <div className="h-14 flex items-center gap-2 px-4 border-b border-border/60 flex-shrink-0">
        <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground grid place-items-center font-mono font-semibold text-[10px] tracking-tight">AC</div>
        <div className="leading-tight">
          <div className="font-semibold text-[15px] tracking-tight">Accounting Completed</div>
          <div className="text-[10px] text-text-soft tracking-wider uppercase">
            {r.firm ?? "Cloud Accounting"}
          </div>
        </div>
      </div>

      {/* Client switcher / brand panel */}
      {r.canSwitchClient ? (
        <button
          onClick={onClientClick}
          type="button"
          className="mx-3 mt-3 px-3 py-2.5 flex items-center gap-3 bg-muted border border-border rounded-md hover:bg-secondary hover:border-border-strong transition-colors text-left"
        >
          <Avatar size={32} className="text-[12px]">{client.initials}</Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-[13.5px] font-medium truncate">{client.name}</div>
            <div className="text-[11px] text-text-soft truncate">{client.sub}</div>
          </div>
          <span className="text-text-soft flex-shrink-0">{ICONS.chevUpDown}</span>
        </button>
      ) : (
        <div className="mx-3 mt-3 px-3 py-2.5 flex items-center gap-3 bg-muted border border-border rounded-md">
          <Avatar size={32} className="text-[12px]">{client.initials}</Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-[13.5px] font-medium truncate">{client.name}</div>
            <div className="text-[11px] text-text-soft truncate">{client.sub}</div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 flex flex-col">
        {groups.map(({ group, items }) => (
          <div key={group.key} className="mb-4">
            {group.label && (
              <div className="px-3 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-text-soft">
                {group.label}
              </div>
            )}
            {items.map((item) => (
              <NavLink
                key={item.key}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 px-3 h-8 rounded-md text-[13.5px] transition-colors cursor-pointer",
                    isActive
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="w-4 h-4 flex-shrink-0 grid place-items-center">
                      {ICONS[item.icon] ?? ICONS.reports}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {item.count !== undefined && (
                      <span className={["text-[11px] tnum font-mono", isActive ? "text-primary" : "text-text-soft"].join(" ")}>
                        {item.count}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}

        <div className="mt-auto">
          <NavLink
            to="/design-system"
            className={({ isActive }) =>
              [
                "flex items-center gap-3 px-3 h-8 rounded-md text-[13.5px] transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              ].join(" ")
            }
          >
            <span className="w-4 h-4 flex-shrink-0 grid place-items-center">{ICONS.zap}</span>
            <span>Design system</span>
          </NavLink>
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
          <span className="w-4 h-4 grid place-items-center">{ICONS.bell}</span>
        </Button>
      </div>
    </aside>
  );
}
