import { http, HttpResponse } from "msw";
import type { SessionUser } from "@accounting-completed/contracts";

export const TEST_USER: SessionUser = {
  userId: 1,
  username: "testuser",
  firmClientId: null,
  roles: { isStaff: true, isCustomer: false, isEmployee: false, isAdmin: false },
};

export const TEST_TOKEN = "test-jwt-token";

export const handlers = [
  http.post("*/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as { username: string; password: string };
    if (body.username === "testuser" && body.password === "password123") {
      return HttpResponse.json({ token: TEST_TOKEN, user: TEST_USER });
    }
    return HttpResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }),

  http.get("*/api/auth/me", ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (auth === `Bearer ${TEST_TOKEN}`) {
      return HttpResponse.json(TEST_USER);
    }
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }),
];
