import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { setToken } from "@accounting-completed/api-client";

const TEST_USER = {
  userId: 1,
  username: "staff@firm.com",
  firmClientId: null,
  roles: { isStaff: true, isCustomer: false, isEmployee: false, isAdmin: false },
};
const TEST_TOKEN = "test-jwt-abc";

const server = setupServer(
  http.post("*/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as { username: string; password: string };
    if (body.username === "staff@firm.com" && body.password === "correct") {
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
);

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => {
  server.resetHandlers();
  setToken(null);
});
afterAll(() => server.close());

function renderLogin() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<div data-testid="dashboard">Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("LoginPage", () => {
  it("renders the sign-in form", () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeTruthy();
    expect(screen.getByLabelText(/password/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeTruthy();
  });

  it("navigates to /dashboard on successful login", async () => {
    renderLogin();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "staff@firm.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "correct" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByTestId("dashboard")).toBeTruthy();
    });
  });

  it("shows an error message on failed login (401)", async () => {
    renderLogin();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "staff@firm.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrongpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeTruthy();
    });
    expect(screen.getByRole("alert").textContent).toMatch(/invalid/i);
  });
});
