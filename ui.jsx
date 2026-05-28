/* global React */
/* MAC · shadcn-style component primitives (Tailwind + CSS variables)
   Mirrors the shadcn/ui API surface: cn() helper, variant maps,
   slotted compound components. Exported to window for Babel sharing.
*/

const { useState, useEffect, useRef, useId, createContext, useContext, useMemo, useCallback } = React;

/* ----- cn() ---------------------------------------------------------- */
function cn(...inputs) {
  return inputs.flat(Infinity).filter(Boolean).join(" ");
}

/* =====================================================================
   Button
   ===================================================================== */
const BUTTON_VARIANTS = {
  default:     "bg-card text-foreground border border-border hover:bg-secondary hover:border-border-strong",
  primary:     "bg-primary text-primary-foreground hover:bg-primary/90 border border-primary",
  secondary:   "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent",
  ghost:       "bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent",
  outline:     "bg-transparent text-foreground border border-border hover:bg-secondary hover:border-border-strong",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 border border-destructive",
  link:        "bg-transparent text-primary underline-offset-4 hover:underline border border-transparent p-0 h-auto",
};
const BUTTON_SIZES = {
  default: "h-8 px-3 text-[13.5px]",
  sm:      "h-[26px] px-2 text-[12px]",
  lg:      "h-9 px-4 text-[14px]",
  icon:    "h-8 w-8 p-0 justify-center",
  "icon-sm":"h-[26px] w-[26px] p-0 justify-center",
};
function Button({ variant = "default", size = "default", className, children, ...rest }) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-2 rounded-md font-medium whitespace-nowrap",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        "disabled:opacity-50 disabled:pointer-events-none",
        BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className
      )}
      {...rest}>
      {children}
    </button>
  );
}

/* =====================================================================
   Input / Textarea / Kbd
   ===================================================================== */
function Input({ className, ...rest }) {
  return (
    <input
      className={cn(
        "h-8 w-full rounded-md border border-input bg-card px-3 text-[13.5px] text-foreground",
        "placeholder:text-text-soft",
        "transition-colors duration-150",
        "hover:border-border-strong",
        "focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/30",
        "disabled:opacity-50 disabled:bg-muted",
        className
      )}
      {...rest}
    />
  );
}
function Kbd({ className, children }) {
  return (
    <kbd className={cn(
      "inline-flex items-center justify-center font-mono text-[10px] text-text-soft",
      "bg-card border border-border rounded px-[5px] py-[1px]",
      className
    )}>{children}</kbd>
  );
}

/* =====================================================================
   Badge
   ===================================================================== */
const BADGE_VARIANTS = {
  default:     "bg-secondary text-muted-foreground border-transparent",
  secondary:   "bg-secondary text-secondary-foreground border-transparent",
  outline:     "bg-transparent text-foreground border-border",
  positive:    "bg-positive-soft text-positive border-transparent",
  destructive: "bg-[hsl(9_70%_94%)] text-destructive border-transparent",
  warning:     "bg-warning-soft text-warning border-transparent",
  info:        "bg-info-soft text-info border-transparent",
  accent:      "bg-accent text-accent-foreground border-transparent",
};
function Badge({ variant = "default", className, children, dot, ...rest }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 h-[22px] px-2 rounded-full text-[12px] font-medium border",
        BADGE_VARIANTS[variant], className
      )}
      {...rest}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/* =====================================================================
   Card
   ===================================================================== */
function Card({ className, children, ...rest }) {
  return (
    <div className={cn("bg-card border border-border rounded-lg shadow-elev-xs overflow-hidden", className)} {...rest}>
      {children}
    </div>
  );
}
function CardHeader({ className, children }) {
  return <div className={cn("flex items-center justify-between gap-4 px-5 py-4 border-b border-border/60", className)}>{children}</div>;
}
function CardTitle({ className, children }) {
  return <h3 className={cn("text-[15px] font-semibold tracking-tight text-foreground", className)}>{children}</h3>;
}
function CardDescription({ className, children }) {
  return <p className={cn("text-[13.5px] text-muted-foreground", className)}>{children}</p>;
}
function CardContent({ className, children }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
function CardFooter({ className, children }) {
  return <div className={cn("px-5 py-3 border-t border-border/60 bg-muted text-[12px] text-muted-foreground", className)}>{children}</div>;
}

/* =====================================================================
   Separator
   ===================================================================== */
function Separator({ className, orientation = "horizontal" }) {
  return (
    <div className={cn(
      orientation === "horizontal" ? "h-px w-full" : "w-px h-full",
      "bg-border", className
    )} role="separator" />
  );
}

/* =====================================================================
   Avatar
   ===================================================================== */
function Avatar({ className, children, size = 32 }) {
  return (
    <div className={cn("relative inline-flex items-center justify-center overflow-hidden rounded-md flex-shrink-0",
                       "bg-gradient-to-br from-[hsl(207_45%_85%)] to-[hsl(207_35%_72%)] text-primary font-semibold",
                       className)}
         style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.4)) }}>
      {children}
    </div>
  );
}
function AvatarRound({ className, children, size = 28 }) {
  return (
    <div className={cn("relative inline-flex items-center justify-center overflow-hidden rounded-full flex-shrink-0",
                       "bg-gradient-to-br from-[hsl(213_25%_88%)] to-[hsl(213_18%_72%)] text-foreground font-semibold",
                       className)}
         style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.38)) }}>
      {children}
    </div>
  );
}

/* =====================================================================
   Table primitives
   ===================================================================== */
function Table({ className, children }) {
  return <table className={cn("w-full border-collapse text-[13.5px]", className)}>{children}</table>;
}
function THead({ className, children }) {
  return <thead className={cn("", className)}>{children}</thead>;
}
function TBody({ className, children }) {
  return <tbody className={className}>{children}</tbody>;
}
function Tr({ className, children, ...rest }) {
  return <tr className={cn("border-b border-border/60 transition-colors hover:bg-muted/60", className)} {...rest}>{children}</tr>;
}
function Th({ className, children, align = "left", ...rest }) {
  return (
    <th
      className={cn(
        "h-9 px-3 bg-muted/60 border-b border-border",
        "text-[11px] font-medium uppercase tracking-wider text-text-soft",
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left",
        className
      )}
      {...rest}>{children}</th>
  );
}
function Td({ className, children, align = "left", num = false, ...rest }) {
  return (
    <td
      className={cn(
        "px-3",
        "align-middle",
        num ? "text-right font-mono tnum tracking-[0.01em]" : "",
        align === "right" ? "text-right" : align === "center" ? "text-center" : "",
        className
      )}
      style={{ height: "var(--row-h, 36px)" }}
      {...rest}>{children}</td>
  );
}

/* =====================================================================
   Tabs (controlled segmented control, à la shadcn)
   ===================================================================== */
function Tabs({ value, onValueChange, children, className }) {
  return (
    <div className={cn("inline-flex p-[3px] bg-card border border-border rounded-md", className)} role="tablist">
      {React.Children.map(children, (c) => React.cloneElement(c, { __active: c.props.value === value, __set: () => onValueChange(c.props.value) }))}
    </div>
  );
}
function TabsTrigger({ value, children, __active, __set }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={__active}
      onClick={__set}
      className={cn(
        "h-6 px-3 rounded-[4px] text-[12px] font-medium transition-colors whitespace-nowrap",
        __active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}>{children}</button>
  );
}

/* =====================================================================
   Popover — lightweight, click-outside aware
   ===================================================================== */
const PopoverCtx = createContext(null);
function Popover({ open: ctrlOpen, onOpenChange, children }) {
  const [uOpen, setUOpen] = useState(false);
  const open = ctrlOpen !== undefined ? ctrlOpen : uOpen;
  const setOpen = onOpenChange || setUOpen;
  const triggerRef = useRef(null);
  return (
    <PopoverCtx.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block">{children}</div>
    </PopoverCtx.Provider>
  );
}
function PopoverTrigger({ asChild, children, ...rest }) {
  const ctx = useContext(PopoverCtx);
  const onClick = (e) => { rest.onClick?.(e); ctx.setOpen(!ctx.open); };
  if (asChild) {
    return React.cloneElement(children, { ref: ctx.triggerRef, onClick, "aria-expanded": ctx.open, ...rest });
  }
  return <button ref={ctx.triggerRef} onClick={onClick} {...rest}>{children}</button>;
}
function PopoverContent({ className, children, align = "start", sideOffset = 6, style = {} }) {
  const ctx = useContext(PopoverCtx);
  const ref = useRef(null);
  useEffect(() => {
    if (!ctx.open) return;
    const onDocClick = (e) => {
      if (!ref.current) return;
      if (ref.current.contains(e.target)) return;
      if (ctx.triggerRef.current?.contains(e.target)) return;
      ctx.setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") ctx.setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDocClick); document.removeEventListener("keydown", onKey); };
  }, [ctx.open]);
  if (!ctx.open) return null;
  const alignClass = align === "end" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0";
  return (
    <div
      ref={ref}
      role="dialog"
      className={cn(
        "absolute z-50 min-w-[220px] mt-[6px] rounded-md border border-border bg-popover text-popover-foreground shadow-elev-pop",
        "animate-scale-in origin-top",
        alignClass, className
      )}
      style={{ marginTop: sideOffset, ...style }}>
      {children}
    </div>
  );
}

/* =====================================================================
   Dialog (modal) — lightweight
   ===================================================================== */
function Dialog({ open, onOpenChange, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onOpenChange(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center animate-fade-in">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px]" onClick={() => onOpenChange(false)} />
      <div className="relative animate-scale-in">{children}</div>
    </div>
  );
}
function DialogContent({ className, children }) {
  return (
    <div className={cn("bg-card text-card-foreground border border-border rounded-lg shadow-elev-lg overflow-hidden", className)}>
      {children}
    </div>
  );
}

/* =====================================================================
   Command (search + filtered list with keyboard nav) — the shadcn-style picker
   ===================================================================== */
function CommandShell({ className, children }) {
  return (
    <div className={cn(
      "flex flex-col bg-popover text-popover-foreground rounded-md overflow-hidden",
      className
    )}>{children}</div>
  );
}
function CommandInput({ value, onChange, placeholder = "Search…", autoFocus = true }) {
  return (
    <div className="flex items-center gap-2 px-3 h-11 border-b border-border">
      <span className="text-text-soft">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
        </svg>
      </span>
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-[14px] text-foreground placeholder:text-text-soft"
      />
      <Kbd>esc</Kbd>
    </div>
  );
}
function CommandList({ className, children }) {
  return <div className={cn("max-h-[360px] overflow-y-auto py-1", className)} role="listbox">{children}</div>;
}
function CommandGroup({ heading, children, action }) {
  return (
    <div className="py-1">
      {(heading || action) && (
        <div className="flex items-center justify-between px-3 py-1.5">
          <div className="text-[11px] font-medium uppercase tracking-wider text-text-soft">{heading}</div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
function CommandItem({ active, onClick, onMouseEnter, className, children }) {
  return (
    <div
      role="option"
      aria-selected={active}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        "mx-1 px-3 py-2 rounded-md flex items-center gap-3 cursor-pointer transition-colors",
        active ? "bg-secondary text-foreground" : "hover:bg-secondary/60",
        className
      )}>{children}</div>
  );
}
function CommandEmpty({ children }) {
  return <div className="px-3 py-6 text-center text-[13px] text-muted-foreground">{children}</div>;
}
function CommandFooter({ children }) {
  return <div className="px-3 py-2 border-t border-border bg-muted text-[11px] text-text-soft flex items-center justify-between">{children}</div>;
}

/* =====================================================================
   Sparkline (used in KPI tiles + client rows)
   ===================================================================== */
function Sparkline({ values, color = "hsl(var(--primary))", width = 72, height = 28, strokeWidth = 1.6 }) {
  if (!values || values.length < 2) return null;
  const pad = 2;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = pad + (i * (width - pad * 2)) / (values.length - 1);
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="opacity-80">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* =====================================================================
   Export to window for cross-script use under Babel standalone
   ===================================================================== */
Object.assign(window, {
  cn,
  Button, Input, Kbd, Badge,
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Separator,
  Avatar, AvatarRound,
  Table, THead, TBody, Tr, Th, Td,
  Tabs, TabsTrigger,
  Popover, PopoverTrigger, PopoverContent,
  Dialog, DialogContent,
  CommandShell, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty, CommandFooter,
  Sparkline,
});
