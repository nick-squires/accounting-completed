export type Role = "staff" | "owner" | "employee";
export type NavGroupKey = "top" | "reports" | "setup" | "account" | "admin";

export interface NavItem {
  key: string;
  label: string;
  icon: string;
  group: NavGroupKey;
  to: string;
  roles: Role[];
}
export interface NavGroup { key: NavGroupKey; label: string | null; roles: Role[]; }
