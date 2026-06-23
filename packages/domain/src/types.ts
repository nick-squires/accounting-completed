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

export type WorkloadFlag = "needs-review" | "archived" | null;

export interface WorkloadClient {
  id: string;
  name: string;
  initials: string;
  entity: string;
  industry: string;
  owner: string;
  openTasks: number;
  flag: WorkloadFlag;
  opened: string;
  pinned?: boolean;
  spark?: number[];
}

export type ActivityKind = "approve" | "reconcile" | "system" | "comment" | "close" | "rule" | "alert";

export interface ActivityItem {
  who: string;
  initials: string;
  action: string;
  client: string;
  what: string;
  time: string;
  kind: ActivityKind;
}

export interface DeadlineItem {
  date: string;
  label: string;
  client: string;
  in: string;
  urgent?: boolean;
}

export type TxnConfidence = "exact" | "high" | "med" | "low" | "none";
export type TxnType = "credit" | "debit";
export type TxnStatus = "review" | "categorized" | "excluded";

export interface Transaction {
  id: string;
  date: string;
  iso: string;
  desc: string;
  memo: string | null;
  amount: number;
  account: string;
  suggested: string | null;
  rule: string | null;
  confidence: TxnConfidence;
  type: TxnType;
  status: TxnStatus;
  needsAttn?: boolean;
}
