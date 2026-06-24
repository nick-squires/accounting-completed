import { prisma } from "../client";

export interface ActivityRow {
  id: number;
  when: Date;
  actor: string | null;
  updateType: string;
  oldPayee: string | null;
  newPayee: string | null;
  oldCategory: string | null;
  newCategory: string | null;
}

export const activityRepository = {
  async recent(firmClientId: number, limit: number): Promise<ActivityRow[]> {
    const rows = await prisma.accountTransactionUpdateHistory.findMany({
      where: { Users: { Client_Id: firmClientId } },
      orderBy: { CreatedDate: "desc" },
      take: limit,
      select: {
        AccountTransactionUpdateHistoryId: true,
        CreatedDate: true,
        TransactionUpdateType: true,
        Old_Payee_Name: true,
        New_Payee_Name: true,
        Old_Category_Name: true,
        New_Category_Name: true,
        Users: { select: { Full_Name: true, First_Name: true } },
      },
    });
    return rows.map((r) => ({
      id: r.AccountTransactionUpdateHistoryId,
      when: r.CreatedDate,
      actor: r.Users?.Full_Name?.trim() || r.Users?.First_Name?.trim() || null,
      updateType: r.TransactionUpdateType,
      oldPayee: r.Old_Payee_Name?.trim() || null,
      newPayee: r.New_Payee_Name?.trim() || null,
      oldCategory: r.Old_Category_Name?.trim() || null,
      newCategory: r.New_Category_Name?.trim() || null,
    }));
  },
};
