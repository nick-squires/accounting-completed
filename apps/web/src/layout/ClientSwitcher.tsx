import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@accounting-completed/ui";
import type { ClientSummary } from "@accounting-completed/contracts";

interface ClientSwitcherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientSummary[];
  currentId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
}

/**
 * Searchable client picker. Replaces the old always-expanded inline client list
 * (which dumped the entire firm — 100+ clients — into the sidebar).
 */
export function ClientSwitcher({ open, onOpenChange, clients, currentId, onSelect, loading }: ClientSwitcherProps) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search clients…" />
      <CommandList>
        <CommandEmpty>{loading ? "Loading clients…" : "No clients found."}</CommandEmpty>
        <CommandGroup heading="Clients">
          {clients.map((c) => (
            <CommandItem
              key={c.id}
              value={`${c.name} ${c.id}`}
              onSelect={() => {
                onSelect(c.id);
                onOpenChange(false);
              }}
            >
              <span className="flex-1 truncate">{c.name}</span>
              {c.id === currentId && (
                <span className="ml-2 text-[11px] text-muted-foreground">current</span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
