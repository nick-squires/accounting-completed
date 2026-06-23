import { describe, expect, it } from "vitest";
import {
  incomeStatementRequestSchema,
  incomeStatementSchema,
  incomeStatementYearsSchema,
} from "./income-statement";

const months = Array(12).fill(0);
const bucketed = { months, total: 0 };
const valid = {
  meta: { clientId: 2189, year: 2025, generatedAt: "2026-06-23T00:00:00.000Z" },
  sections: [
    { key: "income", label: "Income", accounts: [], subtotal: bucketed },
    { key: "cogs", label: "Cost of Goods Sold", accounts: [], subtotal: bucketed },
    { key: "expense", label: "Expenses", accounts: [], subtotal: bucketed },
  ],
  grossProfit: bucketed,
  netIncome: bucketed,
  kpis: { totalIncome: 0, grossProfit: 0, totalExpenses: 0, netIncome: 0 },
};

describe("income-statement contracts", () => {
  it("coerces string query params to numbers", () => {
    const r = incomeStatementRequestSchema.parse({ clientId: "2189", year: "2025" });
    expect(r).toEqual({ clientId: 2189, year: 2025 });
  });

  it("accepts a well-formed statement", () => {
    expect(() => incomeStatementSchema.parse(valid)).not.toThrow();
  });

  it("rejects a months array that is not length 12", () => {
    const bad = { ...valid, grossProfit: { months: [1, 2, 3], total: 6 } };
    expect(() => incomeStatementSchema.parse(bad)).toThrow();
  });

  it("rejects a non-finite amount", () => {
    const bad = { ...valid, netIncome: { months: Array(12).fill(0), total: Infinity } };
    expect(() => incomeStatementSchema.parse(bad)).toThrow();
  });

  it("validates the years payload", () => {
    expect(incomeStatementYearsSchema.parse({ years: [2025, 2024] })).toEqual({ years: [2025, 2024] });
  });
});
