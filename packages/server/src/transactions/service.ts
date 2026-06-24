import type { Transaction, TransactionStatus, TransactionsResponse } from "@accounting-completed/contracts";
import type { RawTxnRow } from "./types";

export function deriveStatus(r: RawTxnRow): TransactionStatus {
  if (r.source === "uncategorized") return "review";
  if (r.isArchived || r.isActive === false) return "excluded";
  if ((r.categoryName && r.categoryName.length > 0) || r.isApprove) return "categorized";
  return "review";
}

export function toTransactionsResponse(
  rows: RawTxnRow[],
  meta: { clientId: number; year: number; generatedAt: string },
): TransactionsResponse {
  const transactions: Transaction[] = rows.map((r) => ({
    id: r.id,
    postedDate: r.postedDate.toISOString(),
    payee: r.payee,
    memo: r.memo,
    amount: r.amount,
    category: r.categoryName,
    checkNumber: r.checkNumber,
    account: r.account,
    status: deriveStatus(r),
  }));
  return { meta, transactions };
}
