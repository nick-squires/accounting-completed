import type { Account } from "@accounting-completed/contracts";

export interface AccountGroup {
  type: string;
  accounts: Account[];
  subtotal: number;
}

export function groupAccountsByType(accounts: Account[]): AccountGroup[] {
  const order: string[] = [];
  const byType = new Map<string, AccountGroup>();
  for (const acc of accounts) {
    const type = acc.type?.trim() || "Uncategorized";
    let group = byType.get(type);
    if (!group) {
      group = { type, accounts: [], subtotal: 0 };
      byType.set(type, group);
      order.push(type);
    }
    group.accounts.push(acc);
    group.subtotal += acc.balance ?? 0;
  }
  return order.map((t) => byType.get(t)!);
}
