import { expect, it } from "vitest";
import { cn } from "./cn";

it("merges conflicting tailwind classes, last wins", () => {
  expect(cn("px-2", "px-4")).toBe("px-4");
});
it("drops falsy values", () => {
  expect(cn("a", false, null, undefined, "b")).toBe("a b");
});
