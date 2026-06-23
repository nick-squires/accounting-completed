import { createHash } from "node:crypto";

// Mirrors ASP.NET FormsAuthentication.HashPasswordForStoringInConfigFile(pwd,"md5").
// Confirm the byte encoding against a real credential during rollout.
export function hashLegacyPassword(password: string): string {
  return createHash("md5").update(password, "utf8").digest("hex").toUpperCase();
}
export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  return hashLegacyPassword(password) === stored.toUpperCase();
}
