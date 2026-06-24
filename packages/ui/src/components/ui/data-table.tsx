import * as React from "react";
import { cn } from "../../lib/utils";

export interface DataTableColumn<T> {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  /** Text contributed to the client-side search index for this row. */
  searchText?: (row: T) => string;
  headerClassName?: string;
  cellClassName?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowKey: (row: T) => string;
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  onRowClick?: (row: T) => void;
  /** Shown when there is no data at all. */
  emptyState?: React.ReactNode;
  /** Shown when a search query filters everything out. */
  noResults?: React.ReactNode;
  isLoading?: boolean;
  loadingState?: React.ReactNode;
  className?: string;
}

const SearchIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

/**
 * Headless, client-side data table: search + pagination over an in-memory list.
 * Columns are configured by the consumer, so the same table renders a slim
 * subset (dashboard) or the full set (clients page). Meant to be wrapped in a
 * <Card className="overflow-hidden"> by the consumer.
 */
export function DataTable<T>({
  data,
  columns,
  getRowKey,
  pageSize = 10,
  searchable = true,
  searchPlaceholder = "Search…",
  onRowClick,
  emptyState,
  noResults,
  isLoading = false,
  loadingState,
  className,
}: DataTableProps<T>) {
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(0);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((row) =>
      columns.some((col) => col.searchText && col.searchText(row).toLowerCase().includes(q)),
    );
  }, [data, query, columns]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const start = currentPage * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);
  const colSpan = columns.length;

  return (
    <div className={cn("flex flex-col", className)}>
      {searchable && (
        <div className="p-3 border-b border-border">
          <div className="relative max-w-sm">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-soft pointer-events-none">
              <SearchIcon />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder={searchPlaceholder}
              className="w-full h-8 pl-8 pr-3 rounded-md bg-card border border-border text-[13.5px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-[13.5px]">
          <thead className="bg-muted/60 border-b border-border">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    "text-left px-4 h-9 text-[11px] uppercase tracking-wider text-text-soft font-medium whitespace-nowrap",
                    col.headerClassName,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-12 text-center text-muted-foreground text-[13.5px]">
                  {loadingState ?? "Loading…"}
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-12 text-center">
                  {emptyState ?? <span className="text-muted-foreground text-[13.5px]">No records.</span>}
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-12 text-center">
                  {noResults ?? (
                    <span className="text-muted-foreground text-[13.5px]">No matches for “{query}”.</span>
                  )}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr
                  key={getRowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "border-b border-border/60 last:border-b-0 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-muted/60",
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.id} className={cn("px-4 h-14 align-middle", col.cellClassName)}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > pageSize && (
        <div className="flex items-center justify-between gap-3 p-3 border-t border-border">
          <span className="text-[12.5px] text-muted-foreground">
            Showing{" "}
            <span className="font-mono text-foreground">
              {start + 1}–{Math.min(start + pageSize, filtered.length)}
            </span>{" "}
            of <span className="font-mono text-foreground">{filtered.length}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="h-7 px-2.5 rounded-md border border-border text-[12.5px] font-medium text-foreground hover:bg-secondary disabled:opacity-40 disabled:pointer-events-none"
            >
              Previous
            </button>
            <span className="text-[12.5px] text-muted-foreground tabular-nums">
              Page {currentPage + 1} of {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={currentPage >= pageCount - 1}
              className="h-7 px-2.5 rounded-md border border-border text-[12.5px] font-medium text-foreground hover:bg-secondary disabled:opacity-40 disabled:pointer-events-none"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
