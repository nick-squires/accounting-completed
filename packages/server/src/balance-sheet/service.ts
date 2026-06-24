import type {
  BalanceSheet,
  BalanceSheetGroup,
  BalanceSheetSection,
} from "@accounting-completed/contracts";
import type { BsAccountBalance } from "@accounting-completed/db";

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

const ASSET_TYPES = new Set(["BankingAccount", "Current Assets", "Fixed Assets", "Other Assets"]);
const LIAB_TYPES = new Set(["Credit Card/Loan", "Current Liabilities", "Long Term Liabilities"]);
const EQUITY_TYPES = new Set(["Equity"]);

type SectionKey = "assets" | "liabilities" | "equity";

function sectionOf(type: string): SectionKey | null {
  if (ASSET_TYPES.has(type)) return "assets";
  if (LIAB_TYPES.has(type)) return "liabilities";
  if (EQUITY_TYPES.has(type)) return "equity";
  return null;
}

// Liabilities & Equity are credit-normal: negate the raw ledger sum.
function signedAmount(key: SectionKey, sum: number): number {
  return key === "assets" ? sum : -sum;
}

function displayType(type: string): string {
  if (type === "BankingAccount") return "Current Assets";
  if (type === "Credit Card/Loan") return "Current Liabilities";
  return type;
}

const GROUP_ORDER: Record<SectionKey, string[]> = {
  assets: ["Current Assets", "Fixed Assets", "Other Assets"],
  liabilities: ["Current Liabilities", "Long Term Liabilities"],
  equity: ["Equity"],
};
const SECTION_LABEL: Record<SectionKey, string> = {
  assets: "Assets",
  liabilities: "Liabilities",
  equity: "Equity",
};

export interface BuildBalanceSheetInput {
  balances: BsAccountBalance[];
  retainedEarningsRaw: number; // Σ P&L txns before year start (raw)
  currentNetIncomeRaw: number; // Σ P&L txns within the year (raw)
  clientId: number;
  year: number;
  asOf: string;
  generatedAt: string;
}

export function buildBalanceSheet(input: BuildBalanceSheetInput): BalanceSheet {
  // bucket: section -> displayType -> accounts
  const buckets: Record<SectionKey, Map<string, { code: number; name: string; amount: number }[]>> = {
    assets: new Map(),
    liabilities: new Map(),
    equity: new Map(),
  };

  for (const b of input.balances) {
    const key = sectionOf(b.type);
    if (!key) continue;
    const amount = round2(signedAmount(key, b.sum));
    if (amount === 0) continue; // drop zero-balance accounts
    const dt = displayType(b.type);
    if (!buckets[key].has(dt)) buckets[key].set(dt, []);
    buckets[key].get(dt)!.push({ code: b.code, name: b.name, amount });
  }

  // Equity synthetic accounts (negated P&L). Include when non-zero so an empty client stays clean.
  const retainedEarnings = round2(-input.retainedEarningsRaw);
  const netIncome = round2(-input.currentNetIncomeRaw);
  const equitySynthetic: { code: number; name: string; amount: number }[] = [];
  if (retainedEarnings !== 0) equitySynthetic.push({ code: -1, name: "Retained Earnings", amount: retainedEarnings });
  if (netIncome !== 0) equitySynthetic.push({ code: -2, name: "Net Income", amount: netIncome });
  if (equitySynthetic.length > 0) {
    if (!buckets.equity.has("Equity")) buckets.equity.set("Equity", []);
    buckets.equity.get("Equity")!.push(...equitySynthetic);
  }

  function buildSection(key: SectionKey): BalanceSheetSection {
    const seen = buckets[key];
    const orderedTypes = [
      ...GROUP_ORDER[key].filter((t) => seen.has(t)),
      ...[...seen.keys()].filter((t) => !GROUP_ORDER[key].includes(t)),
    ];
    const groups: BalanceSheetGroup[] = orderedTypes.map((type) => {
      const accounts = seen.get(type)!.sort((a, b) => a.name.localeCompare(b.name));
      const subtotal = round2(accounts.reduce((s, a) => s + a.amount, 0));
      return { type, accounts, subtotal };
    });
    const total = round2(groups.reduce((s, g) => s + g.subtotal, 0));
    return { key, label: SECTION_LABEL[key], groups, total };
  }

  const sections = [buildSection("assets"), buildSection("liabilities"), buildSection("equity")];
  const assets = sections[0].total;
  const liabilities = sections[1].total;
  const equity = sections[2].total;
  const liabilitiesAndEquity = round2(liabilities + equity);
  const balanced = Math.abs(round2(assets - liabilitiesAndEquity)) < 0.01;

  return {
    meta: { clientId: input.clientId, year: input.year, asOf: input.asOf, generatedAt: input.generatedAt },
    sections,
    totals: { assets, liabilities, equity, liabilitiesAndEquity },
    balanced,
  };
}
