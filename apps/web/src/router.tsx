import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./layout/AppLayout";
import { RequireAuth } from "./app/RequireAuth";
import { StubPage } from "./routes/_stub/StubPage";
import { LoginPage } from "./routes/login/LoginPage";
import { DashboardPage } from "./routes/dashboard/DashboardPage";
import { TransactionsPage } from "./routes/transactions/TransactionsPage";
import { ProfitLossPage } from "./routes/profit-loss/ProfitLossPage";
import { ClientsPage } from "./routes/clients/ClientsPage";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/dashboard", element: <DashboardPage />, handle: { title: "Dashboard", crumbs: ["Dashboard"] } },
          { path: "/transactions", element: <TransactionsPage />, handle: { title: "Transactions", crumbs: ["Transactions"] } },
          { path: "/bank-feeds", element: <StubPage />, handle: { title: "Bank feeds", crumbs: ["Bank feeds"] } },
          { path: "/reports/profit-loss", element: <ProfitLossPage />, handle: { title: "Profit & Loss", crumbs: ["Reports", "Profit & Loss"] } },
          { path: "/reports/profit-loss/print", element: <StubPage />, handle: { title: "Profit & Loss (print)", crumbs: ["Reports", "Profit & Loss", "Print"] } },
          { path: "/reports/balance-sheet", element: <StubPage />, handle: { title: "Balance Sheet", crumbs: ["Reports", "Balance Sheet"] } },
          { path: "/reports/general-ledger", element: <StubPage />, handle: { title: "General Ledger", crumbs: ["Reports", "General Ledger"] } },
          { path: "/reports/general-journal", element: <StubPage />, handle: { title: "General Journal", crumbs: ["Reports", "General Journal"] } },
          { path: "/reports/approve", element: <StubPage />, handle: { title: "Approve reports", crumbs: ["Reports", "Approve"] } },
          { path: "/setup/chart-of-accounts", element: <StubPage />, handle: { title: "Chart of accounts", crumbs: ["Setup", "Chart of accounts"] } },
          { path: "/setup/categories", element: <StubPage />, handle: { title: "Categories", crumbs: ["Setup", "Categories"] } },
          { path: "/setup/clients", element: <ClientsPage />, handle: { title: "Clients", crumbs: ["Setup", "Clients"] } },
          { path: "/setup/clients/new", element: <StubPage />, handle: { title: "Add client", crumbs: ["Setup", "Clients", "Add"] } },
          { path: "/setup/staff", element: <StubPage />, handle: { title: "Staff & roles", crumbs: ["Setup", "Staff & roles"] } },
          { path: "/settings", element: <StubPage />, handle: { title: "Settings", crumbs: ["Settings"] } },
          { path: "/plans", element: <StubPage />, handle: { title: "Plans & billing", crumbs: ["Plans & billing"] } },
          { path: "/system-health", element: <StubPage />, handle: { title: "System health", crumbs: ["System health"] } },
          { path: "/clients/switch", element: <StubPage />, handle: { title: "Switch client", crumbs: ["Clients", "Switch"] } },
          { path: "/design-system", element: <StubPage />, handle: { title: "Design system", crumbs: ["Design system"] } },
        ],
      },
    ],
  },
]);
