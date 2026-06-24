import type { ActivityItem } from "@accounting-completed/contracts";
import type { ActivityRow } from "@accounting-completed/db";

export function formatActivity(r: ActivityRow): { action: string; detail: string | null } {
  if (r.oldCategory !== r.newCategory && (r.newCategory || r.oldCategory)) {
    const subject = r.newPayee || r.oldPayee || "Transaction";
    return { action: "Recategorized", detail: `${subject}: ${r.oldCategory || "—"} → ${r.newCategory || "—"}` };
  }
  if (r.oldPayee && r.newPayee && r.oldPayee !== r.newPayee) {
    return { action: "Renamed payee", detail: `${r.oldPayee} → ${r.newPayee}` };
  }
  return { action: r.updateType || "Updated transaction", detail: r.newPayee || r.oldPayee || null };
}

export function toActivityItems(rows: ActivityRow[]): ActivityItem[] {
  return rows.map((r) => {
    const { action, detail } = formatActivity(r);
    return { id: r.id, when: r.when.toISOString(), actor: r.actor, action, detail };
  });
}
