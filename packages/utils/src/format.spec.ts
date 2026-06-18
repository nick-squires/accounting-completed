import { describe, expect, it } from "vitest";
import { fmt, fmtPct } from "./format";

describe("fmt", () => {
  it("renders zero as an em dash", () => expect(fmt(0)).toBe("—"));
  it("adds thousands separators", () => expect(fmt(12345)).toBe("12,345"));
  it("wraps negatives in parentheses", () => expect(fmt(-2048)).toBe("(2,048)"));
  it("drops fractional digits", () => expect(fmt(99.7)).toBe("100"));
});

describe("fmtPct", () => {
  it("renders null as an em dash", () => expect(fmtPct(null)).toBe("—"));
  it("renders NaN as an em dash", () => expect(fmtPct(NaN)).toBe("—"));
  it("formats a ratio to one decimal percent", () => expect(fmtPct(0.1234)).toBe("12.3%"));
});
