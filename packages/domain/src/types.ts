export type Role = "staff" | "owner" | "employee";
export type NavGroupKey = "top" | "reports" | "setup" | "account" | "admin";

export interface NavItem {
  key: string;
  label: string;
  icon: string;
  group: NavGroupKey;
  to: string;
  roles: Role[];
  count?: number;
}
export interface NavGroup { key: NavGroupKey; label: string | null; roles: Role[]; }
export interface RoleInfo {
  label: string;
  user: { name: string; role: string; initials: string };
  firm: string | null;
  canSwitchClient: boolean;
}
export interface Client { id: string; name: string; initials: string; sub: string; }
export interface PLAccount { code: string; name: string; vals: number[]; }
export interface PLSection { id: "income" | "cogs" | "opex"; accounts: PLAccount[]; }
export interface PLData { currentMonth: number; sections: PLSection[]; }
