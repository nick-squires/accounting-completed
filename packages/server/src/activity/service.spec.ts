import { describe, expect, it } from "vitest";
import { formatActivity, toActivityItems } from "./service";
import type { ActivityRow } from "@accounting-completed/db";

const base: ActivityRow = {
  id: 1, when: new Date("2025-05-01T12:00:00.000Z"), actor: "Jane Staff",
  updateType: "Update", oldPayee: null, newPayee: null, oldCategory: null, newCategory: null,
};

describe("formatActivity", () => {
  it("describes a recategorization", () => {
    const r = formatActivity({ ...base, oldPayee: "Office Depot", oldCategory: "Uncategorized", newCategory: "Office Supplies" });
    expect(r.action).toBe("Recategorized");
    expect(r.detail).toBe("Office Depot: Uncategorized → Office Supplies");
  });
  it("describes a payee rename", () => {
    const r = formatActivity({ ...base, oldPayee: "AMZN", newPayee: "Amazon" });
    expect(r.action).toBe("Renamed payee");
    expect(r.detail).toBe("AMZN → Amazon");
  });
  it("falls back to the raw update type", () => {
    const r = formatActivity({ ...base, updateType: "Approved", newPayee: "Acme" });
    expect(r.action).toBe("Approved");
    expect(r.detail).toBe("Acme");
  });
});

describe("toActivityItems", () => {
  it("maps rows to items with ISO timestamps", () => {
    const items = toActivityItems([{ ...base, newPayee: "Acme" }]);
    expect(items[0]).toMatchObject({ id: 1, when: "2025-05-01T12:00:00.000Z", actor: "Jane Staff" });
  });
});
