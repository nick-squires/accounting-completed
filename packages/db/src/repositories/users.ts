import { prisma } from "../client";

export interface UserRow {
  UserId: number;
  UserName: string | null;
  Password: string | null;
  Client_Id: number | null;
  RoleId: number | null;
  Is_Staff: boolean | null;
  Is_Customer: boolean | null;
  Is_Employee: boolean | null;
  Is_Admin: boolean | null;
  Full_Name: string | null;
  Company_Name: string | null;
}

export const usersRepository = {
  findByUsername(username: string): Promise<UserRow | null> {
    return prisma.users.findFirst({
      where: { UserName: username, Is_Active: true, Is_Locked: false },
      select: {
        UserId: true,
        UserName: true,
        Password: true,
        Client_Id: true,
        RoleId: true,
        Is_Staff: true,
        Is_Customer: true,
        Is_Employee: true,
        Is_Admin: true,
        Full_Name: true,
        Company_Name: true,
      },
    });
  },
};
