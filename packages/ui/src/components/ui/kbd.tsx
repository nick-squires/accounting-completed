import * as React from "react"
import { cn } from "../../lib/utils"

export function Kbd({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <kbd className={cn("inline-flex items-center justify-center font-mono text-[10px] text-text-soft bg-card border border-border rounded px-[5px] py-[1px]", className)}>
      {children}
    </kbd>
  );
}
