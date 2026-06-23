import { afterAll, describe, expect, it } from "vitest";
import { prisma, clientsRepository, usersRepository } from "./index";

const RUN = !!process.env.DATABASE_URL && process.env.RUN_DB_TESTS === "1";

describe.skipIf(!RUN)("db repositories (integration, firm 69)", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });
  it("lists real clients for the demo firm", async () => {
    const rows = await clientsRepository.list(69);
    expect(rows.length).toBeGreaterThan(0);
    expect(typeof rows[0].UserId).toBe("number");
  });
  it("finds a known user row shape (or null)", async () => {
    const u = await usersRepository.findByUsername("__no_such_user__");
    expect(u).toBeNull();
  });
});
