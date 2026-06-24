import { prisma } from "../client";

export interface AccountRow {
  Account_Code: number;
  Account_Name: string | null;
  Account_Type: string | null;
  Account_Category: string | null;
  Balance: number | null;
  Bank_Account_Type: string | null;
  Currency_Code: string | null;
  Account_Status: string | null;
}

export const accountsRepository = {
  async list(userId: number): Promise<AccountRow[]> {
    const rows = await prisma.accounts.findMany({
      where: { UserId: userId, Is_Active: true },
      select: {
        Account_Code: true,
        Account_Name: true,
        Account_Type: true,
        Account_Category: true,
        Balance: true,
        Bank_Account_Type: true,
        Currency_Code: true,
        Account_Status: true,
        Display_Position: true,
      },
      orderBy: [{ Display_Position: "asc" }, { Account_Name: "asc" }],
    });
    return rows.map((r) => ({
      Account_Code: r.Account_Code,
      Account_Name: r.Account_Name,
      Account_Type: r.Account_Type,
      Account_Category: r.Account_Category,
      Balance: r.Balance == null ? null : Number(r.Balance),
      Bank_Account_Type: r.Bank_Account_Type,
      Currency_Code: r.Currency_Code,
      Account_Status: r.Account_Status,
    }));
  },
};
