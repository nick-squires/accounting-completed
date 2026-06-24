import { Button, Card, DataTable } from "@accounting-completed/ui";
import { useMe, useClients } from "@accounting-completed/api-client";
import { ICONS } from "../../layout/icons";
import { PageHeader } from "../../components/PageHeader";
import { fullClientColumns } from "./clientColumns";

export function ClientsPage() {
  const { data: me } = useMe();
  const isStaff = me?.roles?.isStaff ?? false;
  const { data: clients, isLoading } = useClients({ enabled: isStaff });

  const count = clients?.length ?? 0;
  const sub = !isStaff
    ? "Staff access required."
    : isLoading
      ? "Loading clients…"
      : `${count} ${count === 1 ? "client" : "clients"}`;

  return (
    <div>
      <PageHeader
        title="Clients"
        sub={sub}
        actions={
          <Button variant="primary">
            {ICONS.plus}
            <span>Add client</span>
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <DataTable
          data={clients ?? []}
          columns={fullClientColumns}
          getRowKey={(c) => c.id}
          pageSize={20}
          searchPlaceholder="Search clients by name, email, or location…"
          isLoading={isStaff && isLoading}
          loadingState="Loading clients…"
          emptyState={
            <div>
              <div className="text-foreground text-[13.5px] font-medium">
                {isStaff ? "No clients yet" : "Staff access required"}
              </div>
              <div className="text-[12.5px] text-text-soft mt-1">
                {isStaff
                  ? "Clients you add will appear here."
                  : "Sign in as a staff user to manage clients."}
              </div>
            </div>
          }
        />
      </Card>
    </div>
  );
}
