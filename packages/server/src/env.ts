import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  JWT_SECRET: z.string().min(16),
  API_PORT: z.coerce.number().default(3001),
});

export const env = schema.parse(process.env);
