import { describe, it, expect } from "vitest";
import { firstName, displayName } from "./user-display";

function user(fields: Record<string, unknown>) {
  // The helpers only read fullName/username; cast through unknown for the test.
  return fields as unknown as Parameters<typeof firstName>[0];
}

describe("firstName", () => {
  it("prefers the dedicated firstName field over fullName", () => {
    expect(firstName(user({ firstName: "Nick", fullName: "Squires, Nick" }))).toBe("Nick");
  });

  it("falls back to parsing fullName when firstName is null", () => {
    expect(firstName(user({ firstName: null, fullName: "Squires, Nick" }))).toBe("Nick");
  });

  it("takes the first token of a 'First Last' name", () => {
    expect(firstName(user({ fullName: "Jordan Lee" }))).toBe("Jordan");
  });

  it("takes the given name from a 'Last, First' name", () => {
    expect(firstName(user({ fullName: "Squires, Nick" }))).toBe("Nick");
  });

  it("handles 'Last, First Middle' by returning just the first given token", () => {
    expect(firstName(user({ fullName: "Squires, Nick A" }))).toBe("Nick");
  });

  it("returns a single name unchanged", () => {
    expect(firstName(user({ fullName: "Nick" }))).toBe("Nick");
  });

  it("falls back to the username when there is no full name", () => {
    expect(firstName(user({ username: "nsquires" }))).toBe("nsquires");
  });

  it("returns '' when there is nothing to show", () => {
    expect(firstName(null)).toBe("");
    expect(firstName(undefined)).toBe("");
  });
});

describe("displayName", () => {
  it("prefers the trimmed full name", () => {
    expect(displayName(user({ fullName: "  Jordan Lee  ", username: "jlee" }))).toBe(
      "Jordan Lee",
    );
  });

  it("falls back to the username", () => {
    expect(displayName(user({ username: "jlee" }))).toBe("jlee");
  });
});
