import { Fragment } from "react";
import type { IncomeStatement } from "@accounting-completed/contracts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const money = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Row({ label, months, total, bold }: { label: string; months: number[]; total: number; bold?: boolean }) {
  return (
    <tr className={bold ? "font-semibold border-t border-border" : ""}>
      <td className="px-3 py-1 text-left sticky left-0 bg-inherit">{label}</td>
      {months.map((m, i) => (
        <td key={i} className="px-3 py-1 text-right tnum">{money(m)}</td>
      ))}
      <td className="px-3 py-1 text-right tnum font-medium">{money(total)}</td>
    </tr>
  );
}

export function PLTable({ data }: { data: IncomeStatement }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-[13px] border-collapse">
        <thead>
          <tr className="bg-muted text-text-soft text-[11px] uppercase tracking-wider">
            <th className="px-3 py-2 text-left sticky left-0 bg-muted">Account</th>
            {MONTHS.map((m) => <th key={m} className="px-3 py-2 text-right">{m}</th>)}
            <th className="px-3 py-2 text-right">Year</th>
          </tr>
        </thead>
        <tbody>
          {data.sections.map((section) => (
            <Fragment key={section.key}>
              <tr className="bg-secondary/50">
                <td className="px-3 py-1.5 font-medium" colSpan={14}>{section.label}</td>
              </tr>
              {section.accounts.map((a) => (
                <Row key={a.code} label={a.name} months={a.months} total={a.total} />
              ))}
              <Row label={`Total ${section.label}`} months={section.subtotal.months} total={section.subtotal.total} bold />
              {section.key === "cogs" && (
                <Row label="Gross Profit" months={data.grossProfit.months} total={data.grossProfit.total} bold />
              )}
            </Fragment>
          ))}
          <Row label="Net Income" months={data.netIncome.months} total={data.netIncome.total} bold />
        </tbody>
      </table>
    </div>
  );
}
