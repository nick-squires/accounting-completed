import { describe, expect, it } from "vitest";
import type { Transaction } from "@accounting-completed/contracts";
import { filterTransactions } from "./filter";

const t = (over: Partial<Transaction>): Transaction => ({
  id: 1, postedDate: "2025-01-01T00:00:00.000Z", payee: "Acme", memo: null, amount: -10,
  category: null, checkNumber: null, account: "Checking", status: "review", ...over,
});

const data: Transaction[] = [
  t({ id: 1, status: "review", payee: "Acme Tools" }),
  t({ id: 2, status: "categorized", payee: "Office Depot", category: "Office Supplies" }),
  t({ id: 3, status: "excluded", payee: "Refund", memo: "duplicate" }),
];

describe("filterTransactions", () => {
  it("returns everything for the 'all' tab with no query", () => {
    expect(filterTransactions(data, "all", "").map((x) => x.id)).toEqual([1, 2, 3]);
  });
  it("filters by tab status", () => {
    expect(filterTransactions(data, "categorized", "").map((x) => x.id)).toEqual([2]);
  });
  it("filters by case-insensitive payee/memo/category query", () => {
    expect(filterTransactions(data, "all", "office").map((x) => x.id)).toEqual([2]);
    expect(filterTransactions(data, "all", "DUPLICATE").map((x) => x.id)).toEqual([3]);
  });
  it("combines tab and query", () => {
    expect(filterTransactions(data, "review", "acme").map((x) => x.id)).toEqual([1]);
    expect(filterTransactions(data, "review", "office")).toEqual([]);
  });
});
