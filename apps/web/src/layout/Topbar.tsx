import { Fragment } from "react";
import type { Role } from "@accounting-completed/domain";
import { Button, Kbd } from "@accounting-completed/ui";
import { useRole } from "../app/role-context";
import { ICONS } from "./icons";

const ROLE_PILL: Record<Role, { label: string; cls: string }> = {
  staff:    { label: "Firm staff",     cls: "bg-primary/15 text-primary" },
  owner:    { label: "Business owner", cls: "bg-positive/15 text-positive" },
  employee: { label: "Employee",       cls: "bg-info/15 text-info" },
};

interface TopbarProps {
  crumbs?: string[];
  children?: React.ReactNode;
}

export function Topbar({ crumbs = [], children }: TopbarProps) {
  const { role } = useRole();
  const pill = ROLE_PILL[role] ?? ROLE_PILL.staff;

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
      <div className={["inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11.5px] font-medium whitespace-nowrap", pill.cls].join(" ")}>
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
        Viewing as {pill.label}
      </div>
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
