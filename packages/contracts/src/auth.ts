import { z } from "zod";
export const loginRequestSchema = z.object({ username: z.string().min(1), password: z.string().min(1) });
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const sessionUserSchema = z.object({
  userId: z.number().int(),
  username: z.string(),
  fullName: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  firmClientId: z.number().int().nullable(),
  roles: z.object({ isStaff: z.boolean(), isCustomer: z.boolean(), isEmployee: z.boolean(), isAdmin: z.boolean() }),
});
export type SessionUser = z.infer<typeof sessionUserSchema>;

export const loginResponseSchema = z.object({ token: z.string(), user: sessionUserSchema });
export type LoginResponse = z.infer<typeof loginResponseSchema>;
