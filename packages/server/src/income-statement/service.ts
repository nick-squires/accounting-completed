import type {
  Bucketed,
  IncomeStatement,
  IncomeStatementAccount,
  IncomeStatementSection,
} from "@accounting-completed/contracts";
import type { PlTxnRow } from "./types";

type SectionKey = "income" | "cogs" | "expense";

const SECTION_ORDER: Array<{ key: SectionKey; label: string; type: PlTxnRow["accountType"] }> = [
  { key: "income", label: "Income", type: "Income" },
  { key: "cogs", label: "Cost of Goods Sold", type: "Cost of Goods Sold" },
  { key: "expense", label: "Expenses", type: "Expense" },
];

const zeros = (): number[] => Array(12).fill(0);
const sum = (a: number[]): number => a.reduce((x, y) => x + y, 0);
const addInto = (target: number[], src: number[]): void => {
  for (let i = 0; i < 12; i++) target[i] += src[i];
};
const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;
const round2Arr = (a: number[]): number[] => a.map(round2);

export function buildIncomeStatement(
  rows: PlTxnRow[],
  req: { clientId: number; year: number; generatedAt: string },
): IncomeStatement {
  const sections: IncomeStatementSection[] = SECTION_ORDER.map(({ key, label, type }) => {
    const inType = rows.filter((r) => r.accountType === type);
    // group by accountCode
    const byCode = new Map<number, IncomeStatementAccount>();
    for (const r of inType) {
      let acc = byCode.get(r.accountCode);
      if (!acc) {
        acc = { code: r.accountCode, name: r.accountName, category: r.accountCategory, months: zeros(), total: 0 };
        byCode.set(r.accountCode, acc);
      }
      // Income is stored negative; present positive. COGS/Expense as-is.
      const value = key === "income" ? -r.amount : r.amount;
      acc.months[r.postedMonth - 1] += value;
    }
    const accounts = [...byCode.values()]
      .map((a) => ({ ...a, months: round2Arr(a.months), total: round2(sum(a.months)) }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const subMonths = zeros();
    for (const a of accounts) addInto(subMonths, a.months);
    const subtotal: Bucketed = { months: round2Arr(subMonths), total: round2(sum(subMonths)) };
    return { key, label, accounts, subtotal };
  });

  const incomeSub = sections[0].subtotal.months;
  const cogsSub = sections[1].subtotal.months;
  const expenseSub = sections[2].subtotal.months;

  const gpMonths = zeros();
  const niMonths = zeros();
  for (let i = 0; i < 12; i++) {
    gpMonths[i] = incomeSub[i] - cogsSub[i];
    niMonths[i] = incomeSub[i] - cogsSub[i] - expenseSub[i];
  }
  const grossProfit: Bucketed = { months: round2Arr(gpMonths), total: round2(sum(gpMonths)) };
  const netIncome: Bucketed = { months: round2Arr(niMonths), total: round2(sum(niMonths)) };

  return {
    meta: { clientId: req.clientId, year: req.year, generatedAt: req.generatedAt },
    sections,
    grossProfit,
    netIncome,
    kpis: {
      totalIncome: sections[0].subtotal.total,
      grossProfit: grossProfit.total,
      totalExpenses: sections[2].subtotal.total,
      netIncome: netIncome.total,
    },
  };
}
