import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DataTable, type DataTableColumn } from "./data-table";

interface Row {
  id: string;
  name: string;
  email: string;
}

const rows: Row[] = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  name: `Person ${i + 1}`,
  email: `person${i + 1}@test.com`,
}));

const columns: DataTableColumn<Row>[] = [
  { id: "name", header: "Name", cell: (r) => r.name, searchText: (r) => r.name },
  { id: "email", header: "Email", cell: (r) => r.email, searchText: (r) => r.email },
];

describe("DataTable", () => {
  it("paginates and exposes page controls", () => {
    render(<DataTable data={rows} columns={columns} getRowKey={(r) => r.id} pageSize={5} />);
    expect(screen.getByText("Person 1")).toBeTruthy();
    expect(screen.queryByText("Person 6")).toBeNull();
    expect(screen.getByText(/Page 1 of 3/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Person 6")).toBeTruthy();
    expect(screen.queryByText("Person 1")).toBeNull();
  });

  it("filters rows by the search query", () => {
    render(
      <DataTable
        data={rows}
        columns={columns}
        getRowKey={(r) => r.id}
        pageSize={5}
        searchPlaceholder="Search…"
      />,
    );
    fireEvent.change(screen.getByPlaceholderText("Search…"), { target: { value: "person5@" } });
    expect(screen.getByText("Person 5")).toBeTruthy();
    expect(screen.queryByText("Person 4")).toBeNull();
    // One match -> pager is hidden.
    expect(screen.queryByText(/Page 1 of/)).toBeNull();
  });

  it("shows the empty state when there is no data", () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        getRowKey={(r) => r.id}
        emptyState={<span>No clients yet</span>}
      />,
    );
    expect(screen.getByText("No clients yet")).toBeTruthy();
  });

  it("calls onRowClick when a row is clicked", () => {
    const onRowClick = vi.fn();
    render(
      <DataTable
        data={rows}
        columns={columns}
        getRowKey={(r) => r.id}
        pageSize={5}
        onRowClick={onRowClick}
      />,
    );
    fireEvent.click(screen.getByText("Person 3"));
    expect(onRowClick).toHaveBeenCalledWith(rows[2]);
  });
});
