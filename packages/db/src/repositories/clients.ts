import { prisma } from "../client";

export interface ClientRow {
  UserId: number;
  Company_Name: string | null;
  Full_Name: string | null;
  Email_Address: string | null;
  City: string | null;
  State: string | null;
  Created_Date: Date | null;
  Is_Verified: boolean | null;
}

export const clientsRepository = {
  list(firmClientId: number): Promise<ClientRow[]> {
    return prisma.users.findMany({
      where: { Client_Id: firmClientId, Is_Customer: true, Is_Active: true, Is_Locked: false },
      select: {
        UserId: true,
        Company_Name: true,
        Full_Name: true,
        Email_Address: true,
        City: true,
        State: true,
        Created_Date: true,
        Is_Verified: true,
      },
      orderBy: [{ Company_Name: "asc" }, { Full_Name: "asc" }],
    });
  },
};
