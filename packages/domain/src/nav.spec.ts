import { describe, expect, it } from "vitest";
import { navForRole } from "./nav";

describe("navForRole", () => {
  it("hides the Clients item and Admin group from owners", () => {
    const groups = navForRole("owner");
    const keys = groups.flatMap((g) => g.items.map((i) => i.key));
    expect(keys).not.toContain("clients");
    expect(keys).not.toContain("health");
  });
  it("omits groups that have no visible items", () => {
    const groups = navForRole("employee");
    expect(groups.every((g) => g.items.length > 0)).toBe(true);
  });
  it("gives staff the multi-client admin items", () => {
    const keys = navForRole("staff").flatMap((g) => g.items.map((i) => i.key));
    expect(keys).toContain("clients");
    expect(keys).toContain("health");
  });
});
