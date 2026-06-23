import { useState, useMemo } from "react";
import { Button, Input, Kbd, Card, CardFooter } from "@accounting-completed/ui";
import { TRANSACTIONS } from "@accounting-completed/domain";
import type { Transaction, TxnConfidence } from "@accounting-completed/domain";
import { cn } from "@accounting-completed/utils";
import { ICONS } from "../../layout/icons";
import { PageHeader } from "../../components/PageHeader";

/* ---------- Currency formatting ----------------------------------------- */
const fmtAmt = (n: number): string => {
  const abs = Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return (n < 0 ? "−" : "") + "$" + abs;
};

const CONFIDENCE: Record<TxnConfidence, { label: string; cls: string; icon: React.ReactNode }> = {
  exact: { label: "Exact match",   cls: "text-positive", icon: ICONS.check },
  high:  { label: "High",          cls: "text-positive", icon: ICONS.check },
  med:   { label: "Suggested",     cls: "text-info",     icon: ICONS.zap },
  low:   { label: "Best guess",    cls: "text-warning",  icon: ICONS.alert },
  none:  { label: "Uncategorized", cls: "text-text-soft", icon: ICONS.alert },
};

/* ---------- Detail panel ------------------------------------------------- */
function DetailPanel({
  t,
  onApprove,
  onSkip,
}: {
  t?: Transaction;
  onApprove: () => void;
  onSkip: () => void;
}) {
  if (!t) {
    return (
      <div className="bg-card border border-border rounded-lg p-10 text-center text-muted-foreground">
        <div className="text-foreground font-medium mb-1">Nothing selected</div>
        <div className="text-[13px]">Pick a transaction on the left to inspect, edit, or approve it.</div>
      </div>
    );
  }
  const conf = CONFIDENCE[t.confidence] ?? CONFIDENCE.none;
  const isIncome = t.amount > 0;

  return (
    <div className="bg-card border border-border rounded-lg shadow-elev-xs overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/60">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-text-soft mb-1">
              <span className="font-mono">{t.iso}</span>
              <span className="mx-1.5">·</span>
              <span>{t.account}</span>
            </div>
            <div className="text-[15px] font-medium truncate">{t.desc}</div>
            {t.memo && <div className="text-[12.5px] text-text-soft mt-0.5 truncate">{t.memo}</div>}
          </div>
          <Button variant="ghost" size="icon-sm">{ICONS.x}</Button>
        </div>
        <div
          className={cn(
            "font-mono tnum text-[32px] leading-none font-medium tracking-tight mt-4",
            isIncome ? "text-positive" : "text-foreground"
          )}
        >
          {fmtAmt(t.amount)}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-5">
        {/* Category */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] uppercase tracking-wider text-text-soft font-medium">Category</label>
            <span className={cn("flex items-center gap-1 text-[11px]", conf.cls)}>
              <span className="w-3 h-3 grid place-items-center">{conf.icon}</span>
              {conf.label}
            </span>
          </div>
          <div
            className={cn(
              "h-10 px-3 rounded-md border bg-card text-foreground flex items-center justify-between gap-2 cursor-pointer hover:border-border-strong transition-colors",
              t.suggested ? "border-border" : "border-warning/40 bg-warning-soft/40"
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              {t.suggested ? (
                <>
                  <span className="font-mono text-[11px] text-text-soft">{t.suggested.split(" ")[0]}</span>
                  <span className="text-[13.5px] truncate">{t.suggested.split(" ").slice(1).join(" ")}</span>
                </>
              ) : (
                <span className="text-[13.5px] text-warning font-medium">Choose a category…</span>
              )}
            </div>
            <span className="text-text-soft">{ICONS.chevDown}</span>
          </div>
        </div>

        {/* Customer / Vendor */}
        <div>
          <label className="text-[11px] uppercase tracking-wider text-text-soft font-medium block mb-1.5">
            {isIncome ? "Customer" : "Vendor / payee"}
          </label>
          <Input placeholder={isIncome ? "Apply to customer (optional)" : "Apply to vendor (optional)"} />
        </div>

        {/* Memo */}
        <div>
          <label className="text-[11px] uppercase tracking-wider text-text-soft font-medium block mb-1.5">Memo</label>
          <textarea
            className="w-full min-h-[64px] px-3 py-2 rounded-md border border-input bg-card text-[13.5px] resize-y focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
            defaultValue={t.memo ?? ""}
            placeholder="Notes for your future self…"
          />
        </div>

        {/* Attach receipt */}
        <div>
          <label className="text-[11px] uppercase tracking-wider text-text-soft font-medium block mb-1.5">Attachments</label>
          <button className="w-full h-20 rounded-md border border-dashed border-border-strong text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex flex-col items-center justify-center gap-1">
            <span className="w-4 h-4 grid place-items-center">{ICONS.plus}</span>
            <span className="text-[12px]">Drop receipt or click to upload</span>
          </button>
        </div>

        {/* Rule */}
        {t.rule && (
          <div className="bg-accent rounded-md p-3 flex items-start gap-3">
            <span className="w-4 h-4 text-primary mt-0.5">{ICONS.zap}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-medium text-primary">Rule applied</div>
              <div className="text-[12px] text-primary/80 font-mono truncate">{t.rule}</div>
            </div>
            <button className="text-[11.5px] text-primary hover:underline whitespace-nowrap">Edit</button>
          </div>
        )}

        {/* Similar */}
        <div>
          <div className="text-[11px] uppercase tracking-wider text-text-soft font-medium mb-2">
            Similar transactions
          </div>
          <div className="border border-border rounded-md divide-y divide-border/60 overflow-hidden">
            {[
              { date: "May 13", desc: t.desc, amount: t.amount * 0.94, cat: t.suggested ?? "Uncategorized" },
              { date: "May 06", desc: t.desc, amount: t.amount * 1.08, cat: t.suggested ?? "Uncategorized" },
              { date: "Apr 29", desc: t.desc, amount: t.amount * 0.97, cat: t.suggested ?? "Uncategorized" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 px-3 h-9 text-[12.5px]">
                <span className="font-mono text-text-soft w-12">{s.date}</span>
                <span className="flex-1 truncate text-muted-foreground">{s.cat}</span>
                <span className={cn("font-mono tnum", s.amount > 0 ? "text-positive" : "text-foreground")}>
                  {fmtAmt(s.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="border-t border-border bg-muted/60 px-5 py-3 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onSkip}>Skip for now</Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm">{ICONS.x}<span>Exclude</span></Button>
        <Button variant="primary" onClick={onApprove}>
          {ICONS.check}<span>Approve & next</span>
          <span className="ml-1 opacity-70"><Kbd>↵</Kbd></span>
        </Button>
      </div>
    </div>
  );
}

/* ---------- Page --------------------------------------------------------- */
type TxnTab = "review" | "categorized" | "excluded" | "all";
type AccountFilter = "all" | "chase" | "amex";

export function TransactionsPage() {
  const [tab, setTab] = useState<TxnTab>("review");
  const [account, setAccount] = useState<AccountFilter>("all");
  const [selected, setSelected] = useState("t1");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");

  const visible = useMemo(() => {
    let list = TRANSACTIONS;
    if (account === "chase") list = list.filter(t => t.account.startsWith("Chase"));
    if (account === "amex")  list = list.filter(t => t.account.startsWith("Amex"));
    if (q) {
      const n = q.toLowerCase();
      list = list.filter(t => t.desc.toLowerCase().includes(n) || (t.memo ?? "").toLowerCase().includes(n));
    }
    return list;
  }, [account, q]);

  const sel = TRANSACTIONS.find(t => t.id === selected);

  const toggleCheck = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (checked.size === visible.length) setChecked(new Set());
    else setChecked(new Set(visible.map(t => t.id)));
  };

  const onApprove = () => {
    // advance to the next transaction in the visible list (wraps to first)
    const i = visible.findIndex(t => t.id === selected);
    setSelected(visible[i + 1]?.id ?? visible[0]?.id ?? "");
  };
  const onSkip = onApprove;

  const tabs: { v: TxnTab; l: string; c: number }[] = [
    { v: "review",      l: "For review",  c: 42 },
    { v: "categorized", l: "Categorized", c: 1284 },
    { v: "excluded",    l: "Excluded",    c: 18 },
    { v: "all",         l: "All",         c: 1344 },
  ];

  const accounts: { v: AccountFilter; l: string }[] = [
    { v: "all",   l: "All accounts" },
    { v: "chase", l: "Chase ·5847" },
    { v: "amex",  l: "Amex ·1124" },
  ];

  return (
    <div>
      <PageHeader
        title="Transactions"
        sub={
          <>
            Atlas Coffee Roasters · <span className="font-mono text-foreground font-medium">42 to review</span> across 2 accounts
          </>
        }
        actions={
          <>
            <Button>{ICONS.refresh}<span>Refresh feeds</span></Button>
            <Button>{ICONS.zap}<span>Rules</span></Button>
            <Button>{ICONS.download}<span>Export</span></Button>
            <Button variant="primary">{ICONS.plus}<span>Add transaction</span></Button>
          </>
        }
      />

      {/* Tab strip */}
      <div className="flex items-center gap-1 mb-4 border-b border-border">
        {tabs.map(opt => (
          <button
            key={opt.v}
            onClick={() => setTab(opt.v)}
            className={cn(
              "px-3 py-2.5 text-[13.5px] font-medium border-b-2 -mb-px transition-colors",
              tab === opt.v
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.l}
            <span className={cn("ml-1.5 font-mono tnum text-[11px]", tab === opt.v ? "text-primary" : "text-text-soft")}>
              {opt.c}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[280px] max-w-md">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-soft">{ICONS.search}</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search descriptions, memos, amounts…"
            className="w-full h-8 pl-8 pr-3 rounded-md bg-card border border-border text-[13.5px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <div className="flex items-center gap-1 bg-card border border-border rounded-md p-[3px]">
          {accounts.map(opt => (
            <button
              key={opt.v}
              onClick={() => setAccount(opt.v)}
              className={cn(
                "h-6 px-3 rounded text-[12px] font-medium transition-colors",
                account === opt.v ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.l}
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline">{ICONS.cal}<span>This month</span></Button>
        <Button size="sm" variant="outline">{ICONS.filter}<span>More filters</span></Button>
      </div>

      {/* Bulk bar */}
      {checked.size > 0 && (
        <div className="flex items-center gap-3 mb-3 px-4 h-11 bg-accent rounded-md border border-primary/20">
          <span className="font-mono tnum text-primary font-medium">{checked.size}</span>
          <span className="text-primary text-[13px]">selected</span>
          <div className="flex-1" />
          <Button size="sm" variant="primary">{ICONS.check}<span>Approve all</span></Button>
          <Button size="sm">{ICONS.cats}<span>Recategorize</span></Button>
          <Button size="sm" variant="ghost">{ICONS.x}<span>Exclude</span></Button>
          <Button size="sm" variant="ghost" onClick={() => setChecked(new Set())}>Clear</Button>
        </div>
      )}

      {/* Split layout: table + detail */}
      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 420px" }}>
        <Card className="overflow-hidden">
          <table className="w-full text-[13.5px]">
            <thead className="bg-muted/60 border-b border-border">
              <tr>
                <th className="w-10 px-3 h-9">
                  <input
                    type="checkbox"
                    checked={checked.size === visible.length && visible.length > 0}
                    onChange={toggleAll}
                    className="w-3.5 h-3.5 rounded-sm accent-primary cursor-pointer"
                  />
                </th>
                <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[80px]">Date</th>
                <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium">Description</th>
                <th className="text-left px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[260px]">Suggested category</th>
                <th className="text-right px-3 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium w-[140px]">Amount</th>
                <th className="w-[120px]"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map(t => {
                const conf = CONFIDENCE[t.confidence] ?? CONFIDENCE.none;
                const isSel = t.id === selected;
                const isChecked = checked.has(t.id);
                return (
                  <tr
                    key={t.id}
                    onClick={() => setSelected(t.id)}
                    className={cn(
                      "border-b border-border/60 cursor-pointer transition-colors group",
                      isSel ? "bg-accent" : isChecked ? "bg-muted/60" : "hover:bg-muted/60"
                    )}
                    style={{ height: "var(--row-h, 48px)" }}
                  >
                    <td className="px-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCheck(t.id)}
                        className="w-3.5 h-3.5 rounded-sm accent-primary cursor-pointer"
                      />
                    </td>
                    <td className="px-3 font-mono text-[12.5px] text-muted-foreground">{t.date}</td>
                    <td className="px-3">
                      <div className="flex items-center gap-2">
                        {t.needsAttn && <span className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" title="Needs your attention" />}
                        <div className="min-w-0">
                          <div className="font-medium truncate">{t.desc}</div>
                          {t.memo && <div className="text-[11.5px] text-text-soft truncate">{t.memo}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3">
                      {t.suggested ? (
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={cn("w-3 h-3 flex-shrink-0", conf.cls)}>{conf.icon}</span>
                          <span className="text-[13px] truncate">{t.suggested.split(" ").slice(1).join(" ")}</span>
                        </div>
                      ) : (
                        <span className="text-[13px] text-warning font-medium flex items-center gap-1.5">
                          <span className="w-3 h-3">{ICONS.alert}</span>
                          Uncategorized
                        </span>
                      )}
                    </td>
                    <td className={cn("px-3 text-right font-mono tnum font-medium", t.amount > 0 ? "text-positive" : "text-foreground")}>
                      {fmtAmt(t.amount)}
                    </td>
                    <td className="px-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {t.suggested && (
                          <Button size="sm" variant="primary" className="h-7 px-2.5">
                            <span className="w-3 h-3 grid place-items-center">{ICONS.check}</span>
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 justify-center">{ICONS.more}</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <CardFooter>
            <div className="flex items-center justify-between w-full text-[12.5px] text-muted-foreground">
              <span>
                Showing <span className="font-mono text-foreground">{visible.length}</span> of 42 ·{" "}
                <a href="#" className="text-primary hover:underline">Load more →</a>
              </span>
              <span className="flex items-center gap-2">
                <Kbd>↑</Kbd><Kbd>↓</Kbd> navigate
                <span className="mx-1">·</span>
                <Kbd>↵</Kbd> approve
                <span className="mx-1">·</span>
                <Kbd>E</Kbd> edit
              </span>
            </div>
          </CardFooter>
        </Card>

        <div className="min-w-0">
          <DetailPanel t={sel} onApprove={onApprove} onSkip={onSkip} />
        </div>
      </div>
    </div>
  );
}
