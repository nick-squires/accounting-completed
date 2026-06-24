import { describe, expect, it } from "vitest";
import type { Account } from "@accounting-completed/contracts";
import { groupAccountsByType } from "./groupAccounts";

const a = (over: Partial<Account>): Account => ({
  code: 1, name: "X", type: "Asset", category: null, balance: 0,
  bankAccountType: null, currency: "USD", status: "active", ...over,
});

describe("groupAccountsByType", () => {
  it("groups by type, sums balances, and orders groups by first appearance", () => {
    const groups = groupAccountsByType([
      a({ code: 1, type: "Asset", balance: 100 }),
      a({ code: 2, type: "Liability", balance: 40 }),
      a({ code: 3, type: "Asset", balance: 25 }),
    ]);
    expect(groups.map((g) => g.type)).toEqual(["Asset", "Liability"]);
    expect(groups[0].subtotal).toBe(125);
    expect(groups[0].accounts.map((x) => x.code)).toEqual([1, 3]);
    expect(groups[1].subtotal).toBe(40);
  });
  it("buckets null/empty types under 'Uncategorized' and treats null balance as 0", () => {
    const groups = groupAccountsByType([a({ code: 9, type: null, balance: null })]);
    expect(groups[0].type).toBe("Uncategorized");
    expect(groups[0].subtotal).toBe(0);
  });
});
