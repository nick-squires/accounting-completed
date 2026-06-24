import { describe, expect, it } from "vitest";
import { deriveStatus, toTransactionsResponse } from "./service";
import type { RawTxnRow } from "./types";

const base: RawTxnRow = {
  id: 1, postedDate: new Date("2025-03-04T00:00:00.000Z"), payee: "Office Depot",
  memo: null, amount: -42.5, categoryName: null, checkNumber: null, account: "Checking",
  isApprove: null, isArchived: false, isActive: true, source: "ledger",
};

describe("deriveStatus", () => {
  it("marks uncategorized-source rows as review", () => {
    expect(deriveStatus({ ...base, source: "uncategorized" })).toBe("review");
  });
  it("marks archived rows as excluded", () => {
    expect(deriveStatus({ ...base, isArchived: true })).toBe("excluded");
  });
  it("marks inactive rows as excluded", () => {
    expect(deriveStatus({ ...base, isActive: false })).toBe("excluded");
  });
  it("marks rows with a category as categorized", () => {
    expect(deriveStatus({ ...base, categoryName: "Office Supplies" })).toBe("categorized");
  });
  it("marks approved rows as categorized", () => {
    expect(deriveStatus({ ...base, isApprove: true })).toBe("categorized");
  });
  it("marks bare ledger rows as review", () => {
    expect(deriveStatus(base)).toBe("review");
  });
});

describe("toTransactionsResponse", () => {
  it("maps rows to ISO-dated transactions with derived status", () => {
    const res = toTransactionsResponse([base], { clientId: 2189, year: 2025, generatedAt: "2025-06-01T00:00:00.000Z" });
    expect(res.meta).toEqual({ clientId: 2189, year: 2025, generatedAt: "2025-06-01T00:00:00.000Z" });
    expect(res.transactions[0]).toEqual({
      id: 1, postedDate: "2025-03-04T00:00:00.000Z", payee: "Office Depot", memo: null,
      amount: -42.5, category: null, checkNumber: null, account: "Checking", status: "review",
    });
  });
});
