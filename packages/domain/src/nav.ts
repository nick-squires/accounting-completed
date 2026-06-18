import type { NavGroup, NavItem, Role, RoleInfo } from "./types";

export const ROLES: Record<Role, RoleInfo> = {
  staff: { label: "Firm staff", user: { name: "Scott Turner", role: "Senior bookkeeper", initials: "ST" }, firm: "Records in Order", canSwitchClient: true },
  owner: { label: "Business owner", user: { name: "Diego Marín", role: "Owner & founder", initials: "DM" }, firm: null, canSwitchClient: false },
  employee: { label: "Employee", user: { name: "Sam Park", role: "Bookkeeper", initials: "SP" }, firm: null, canSwitchClient: false },
};

export const NAV: NavItem[] = [
  { key: "dash", label: "Dashboard", icon: "dash", group: "top", to: "/dashboard", roles: ["staff", "owner", "employee"] },
  { key: "txns", label: "Transactions", icon: "txns", group: "top", to: "/transactions", roles: ["staff", "owner", "employee"], count: 42 },
  { key: "bank", label: "Bank feeds", icon: "bank", group: "top", to: "/bank-feeds", roles: ["staff", "owner"] },
  { key: "pl", label: "Profit & Loss", icon: "pl", group: "reports", to: "/reports/profit-loss", roles: ["staff", "owner", "employee"] },
  { key: "balance", label: "Balance Sheet", icon: "balance", group: "reports", to: "/reports/balance-sheet", roles: ["staff", "owner"] },
  { key: "ledger", label: "General Ledger", icon: "ledger", group: "reports", to: "/reports/general-ledger", roles: ["staff", "owner"] },
  { key: "journal", label: "General Journal", icon: "reports", group: "reports", to: "/reports/general-journal", roles: ["staff", "owner"] },
  { key: "approve", label: "Approve reports", icon: "approve", group: "reports", to: "/reports/approve", roles: ["staff", "owner"], count: 3 },
  { key: "coa", label: "Chart of accounts", icon: "accounts", group: "setup", to: "/setup/chart-of-accounts", roles: ["staff", "owner"] },
  { key: "cats", label: "Categories", icon: "cats", group: "setup", to: "/setup/categories", roles: ["staff", "owner"] },
  { key: "clients", label: "Clients", icon: "clients", group: "setup", to: "/setup/clients", roles: ["staff"], count: 28 },
  { key: "staff", label: "Staff & roles", icon: "staff", group: "setup", to: "/setup/staff", roles: ["staff", "owner"] },
  { key: "settings", label: "Settings", icon: "settings", group: "setup", to: "/settings", roles: ["staff", "owner"] },
  { key: "plans", label: "Plans & billing", icon: "card", group: "account", to: "/plans", roles: ["owner"] },
  { key: "health", label: "System health", icon: "health", group: "admin", to: "/system-health", roles: ["staff"] },
];

export const GROUPS: NavGroup[] = [
  { key: "top", label: null, roles: ["staff", "owner", "employee"] },
  { key: "reports", label: "Reports", roles: ["staff", "owner", "employee"] },
  { key: "setup", label: "Setup", roles: ["staff", "owner"] },
  { key: "account", label: "Account", roles: ["owner"] },
  { key: "admin", label: "Admin", roles: ["staff"] },
];

export function navForRole(role: Role): { group: NavGroup; items: NavItem[] }[] {
  return GROUPS.filter((g) => g.roles.includes(role))
    .map((group) => ({ group, items: NAV.filter((n) => n.group === group.key && n.roles.includes(role)) }))
    .filter((entry) => entry.items.length > 0);
}
