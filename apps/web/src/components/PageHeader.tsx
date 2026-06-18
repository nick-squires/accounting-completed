import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  sub?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, sub, actions }: PageHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-6 mb-6 flex-wrap">
      <div>
        <h1 className="text-[28px] leading-9 font-semibold tracking-tight m-0 mb-1">{title}</h1>
        {sub && <div className="text-[15px] text-muted-foreground">{sub}</div>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
