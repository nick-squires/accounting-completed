import type { SessionUser } from "@accounting-completed/contracts";

/** Best display name for a session user: real full name, else username, else "". */
export function displayName(me: SessionUser | null | undefined): string {
  return me?.fullName?.trim() || me?.username || "";
}

/** First name (or whole name) for greetings. */
export function firstName(me: SessionUser | null | undefined): string {
  const name = displayName(me);
  return name.split(/\s+/)[0] ?? "";
}

/** Up-to-two-letter initials from a name; "?" when empty. */
export function deriveInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((w) => w[0] ?? "").join("");
  return letters.toUpperCase() || "?";
}

/** Human label for a user's role, derived from the real role flags. */
export function roleLabel(roles: SessionUser["roles"] | undefined): string {
  if (!roles) return "";
  if (roles.isStaff) return "Firm staff";
  if (roles.isEmployee) return "Employee";
  if (roles.isAdmin) return "Administrator";
  if (roles.isCustomer) return "Business owner";
  return "";
}
