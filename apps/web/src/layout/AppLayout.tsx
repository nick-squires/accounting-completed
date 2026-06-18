import { Outlet, useMatches } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppLayout() {
  const matches = useMatches();
  const crumbs = (matches.at(-1)?.handle as { crumbs?: string[] } | undefined)?.crumbs ?? [];
  return (
    <div
      className="h-screen w-screen grid"
      style={{ gridTemplateColumns: "240px 1fr", gridTemplateRows: "56px 1fr" }}
    >
      <div className="row-span-2">
        {/* onClientClick is a stub; full client-picker dialog is a follow-on task */}
        <Sidebar onClientClick={() => undefined} />
      </div>
      <Topbar crumbs={crumbs} />
      <main className="overflow-auto p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
