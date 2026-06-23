import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaMssql } from "@prisma/adapter-mssql";
import { PrismaClient } from "../generated/prisma/client";

// Load .env from project root regardless of cwd (works in both nx runner and direct vitest)
const __dirname = fileURLToPath(new URL(".", import.meta.url));
config({ path: resolve(__dirname, "../../../.env") });

const adapter = new PrismaMssql({
  server: process.env.MAC_DB_SERVER!,
  port: Number(process.env.MAC_DB_PORT ?? 1433),
  database: process.env.MAC_DB_NAME!,
  user: process.env.MAC_DB_USER!,
  password: process.env.MAC_DB_PASSWORD!,
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  options: { encrypt: process.env.MAC_DB_ENCRYPT !== "false", trustServerCertificate: process.env.MAC_DB_TRUST_CERT === "true" },
});

export const prisma = new PrismaClient({ adapter });
