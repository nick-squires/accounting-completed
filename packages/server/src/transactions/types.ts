// Re-export the repository row type so the pure service depends on a name, not on prisma.
export type { RawTxnRow } from "@accounting-completed/db";
