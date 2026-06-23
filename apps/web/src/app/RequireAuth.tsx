import { Navigate, Outlet } from "react-router-dom";
import { useMe } from "@accounting-completed/api-client";

export function RequireAuth() {
  const { data, isLoading } = useMe();
  if (isLoading) return <div className="p-10 text-muted-foreground">Loading…</div>;
  return data ? <Outlet /> : <Navigate to="/login" replace />;
}
