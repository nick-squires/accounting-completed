import { describe, expect, it } from "vitest";
import { hashLegacyPassword, verifyPassword } from "./password";

describe("legacy password (MD5 uppercase hex)", () => {
  it("produces 32-char uppercase hex", () => {
    const h = hashLegacyPassword("Secret123");
    expect(h).toMatch(/^[0-9A-F]{32}$/);
  });
  it("verifies a matching password and rejects a wrong one", () => {
    const stored = hashLegacyPassword("Secret123");
    expect(verifyPassword("Secret123", stored)).toBe(true);
    expect(verifyPassword("nope", stored)).toBe(false);
  });
  it("compares case-insensitively to stored hash", () => {
    const stored = hashLegacyPassword("Secret123").toLowerCase();
    expect(verifyPassword("Secret123", stored)).toBe(true);
  });
});
