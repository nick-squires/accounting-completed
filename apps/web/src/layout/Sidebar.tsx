import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { navForRole } from "@accounting-completed/domain";
import { useMe, useClients } from "@accounting-completed/api-client";
import { Avatar, AvatarRound, Button } from "@accounting-completed/ui";
import { useRole } from "../app/role-context";
import { useClient } from "../app/client-context";
import { displayName, deriveInitials, roleLabel } from "../app/user-display";
import { ClientSwitcher } from "./ClientSwitcher";
import { ICONS } from "./icons";

export function Sidebar() {
  const { role } = useRole();
  const { clientId, setClientId } = useClient();
  const groups = navForRole(role);

  const { data: me } = useMe();
  const isStaff = me?.roles?.isStaff ?? false;
  const canSwitchClient = isStaff;
  const { data: apiClients, isLoading: clientsLoading } = useClients({ enabled: isStaff });

  const [switcherOpen, setSwitcherOpen] = useState(false);

  // ⌘K / Ctrl+K toggles the client switcher for staff.
  useEffect(() => {
    if (!canSwitchClient) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSwitcherOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canSwitchClient]);

  // Once the live client list loads, default to the first real client if nothing
  // valid is selected yet (initial state is null).
  useEffect(() => {
    if (!isStaff || !apiClients || apiClients.length === 0) return;
    if (!apiClients.some((c) => c.id === clientId)) setClientId(apiClients[0].id);
  }, [isStaff, apiClients, clientId, setClientId]);

  // Identity from the real session user.
  const userName = displayName(me);
  const firmLabel = me?.companyName?.trim() || "Cloud Accounting";
  const footerInitials = deriveInitials(userName);
  const footerTitle = roleLabel(me?.roles);

  // Client panel: staff pick from the live list; non-staff show their own company.
  const selected = apiClients?.find((c) => c.id === clientId);
  const clientName = isStaff
    ? selected?.name ?? (clientsLoading ? "Loading…" : "Select a client")
    : me?.companyName?.trim() || userName || "—";
  const clientSub = isStaff ? (selected ? "Client" : "") : "";
  const clientInitials = isStaff
    ? selected ? deriveInitials(selected.name) : "·"
    : deriveInitials(me?.companyName?.trim() || userName);

  return (
    <aside className="w-[240px] flex flex-col bg-sidebar border-r border-sidebar-border overflow-hidden">
      {/* Brand */}
      <div className="h-14 flex items-center gap-2 px-4 border-b border-border/60 flex-shrink-0">
        <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground grid place-items-center font-mono font-semibold text-[10px] tracking-tight">AC</div>
        <div className="leading-tight">
          <div className="font-semibold text-[15px] tracking-tight">Accounting Completed</div>
          <div className="text-[10px] text-text-soft tracking-wider uppercase">
            {firmLabel}
          </div>
        </div>
      </div>

      {/* Client switcher / brand panel */}
      {canSwitchClient ? (
        <button
          onClick={() => setSwitcherOpen(true)}
          type="button"
          className="mx-3 mt-3 px-3 py-2.5 flex items-center gap-3 bg-muted border border-border rounded-md hover:bg-secondary hover:border-border-strong transition-colors text-left"
        >
          <Avatar size={32} className="text-[12px]">{clientInitials}</Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-[13.5px] font-medium truncate">{clientName}</div>
            <div className="text-[11px] text-text-soft truncate">{clientSub}</div>
          </div>
          <span className="text-text-soft flex-shrink-0">{ICONS.chevUpDown}</span>
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
      <nav className="flex-1 overflow-y-auto px-3 py-2 flex flex-col mt-2">
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
                <span className="w-4 h-4 flex-shrink-0 grid place-items-center">
                  {ICONS[item.icon] ?? ICONS.reports}
                </span>
                <span className="flex-1">{item.label}</span>
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
        <AvatarRound size={28}>{footerInitials}</AvatarRound>
        <div className="flex-1 min-w-0 leading-tight">
          <div className="text-[13px] font-medium truncate">{userName || "—"}</div>
          <div className="text-[11px] text-text-soft truncate">{footerTitle}</div>
        </div>
        <Button variant="ghost" size="icon-sm" title="Notifications">
          <span className="w-4 h-4 grid place-items-center">{ICONS.bell}</span>
        </Button>
      </div>

      {canSwitchClient && (
        <ClientSwitcher
          open={switcherOpen}
          onOpenChange={setSwitcherOpen}
          clients={apiClients ?? []}
          currentId={clientId}
          onSelect={setClientId}
          loading={clientsLoading}
        />
      )}
    </aside>
  );
}
