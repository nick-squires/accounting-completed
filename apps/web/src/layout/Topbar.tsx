import { Fragment } from "react";
import type { SessionUser } from "@accounting-completed/contracts";
import { useMe } from "@accounting-completed/api-client";
import { Button, Kbd } from "@accounting-completed/ui";
import { roleLabel } from "../app/user-display";
import { ICONS } from "./icons";

function rolePillClass(roles: SessionUser["roles"] | undefined): string {
  if (roles?.isEmployee) return "bg-info/15 text-info";
  if (roles && !roles.isStaff) return "bg-positive/15 text-positive";
  return "bg-primary/15 text-primary";
}

interface TopbarProps {
  crumbs?: string[];
  children?: React.ReactNode;
}

export function Topbar({ crumbs = [], children }: TopbarProps) {
  const { data: me } = useMe();
  const roleText = roleLabel(me?.roles);
  const pillClass = rolePillClass(me?.roles);

  return (
    <div className="h-14 bg-card border-b border-border flex items-center px-6 gap-4 flex-shrink-0">
      <div className="flex items-center gap-2 text-[13.5px] text-muted-foreground">
        {crumbs.map((c, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="text-border-strong">{ICONS.chevRight}</span>}
            <span className={i === crumbs.length - 1 ? "text-foreground font-medium" : ""}>{c}</span>
          </Fragment>
        ))}
      </div>
      <div className="flex-1" />
      <div className="relative w-[260px]">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-soft">{ICONS.search}</span>
        <input
          placeholder="Search anything…"
          className="w-full h-8 pl-8 pr-12 rounded-md bg-muted border border-border text-[13.5px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 focus:bg-card"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2"><Kbd>⌘K</Kbd></span>
      </div>
      {/* Role chip */}
      {roleText && (
        <div className={["inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11.5px] font-medium whitespace-nowrap", pillClass].join(" ")}>
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
          {roleText}
        </div>
      )}
      {children}
      <Button variant="ghost" size="icon" title="Notifications">
        <span className="relative w-4 h-4 grid place-items-center">
          {ICONS.bell}
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-destructive ring-2 ring-card" />
        </span>
      </Button>
    </div>
  );
}
