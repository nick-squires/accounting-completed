import { render, screen, fireEvent, within } from "@testing-library/react";
import { TransactionsPage } from "./TransactionsPage";

describe("TransactionsPage", () => {
  it("renders the page header and account summary", () => {
    render(<TransactionsPage />);
    expect(screen.getByRole("heading", { name: "Transactions" })).toBeTruthy();
    expect(screen.getByText("42 to review")).toBeTruthy();
  });

  it("lists transactions from domain data", () => {
    render(<TransactionsPage />);
    // First row is selected by default ("t1" — Square daily settlement)
    expect(screen.getAllByText("Square daily settlement").length).toBeGreaterThan(0);
    expect(screen.getByText("BLUE BOTTLE COFFEE")).toBeTruthy();
  });

  it("filters by account", () => {
    render(<TransactionsPage />);
    // Amex-only should drop the Chase-only "GUSTO PAYROLL" row
    fireEvent.click(screen.getByRole("button", { name: "Amex ·1124" }));
    expect(screen.queryByText("GUSTO PAYROLL 052126")).toBeNull();
    expect(screen.getByText("MAILCHIMP MONTHLY")).toBeTruthy();
  });

  it("filters by search query", () => {
    render(<TransactionsPage />);
    fireEvent.change(screen.getByPlaceholderText(/Search descriptions/i), {
      target: { value: "payroll" },
    });
    expect(screen.getByText("GUSTO PAYROLL 052126")).toBeTruthy();
    expect(screen.queryByText("BLUE BOTTLE COFFEE")).toBeNull();
  });

  it("shows the bulk action bar after selecting rows via header checkbox", () => {
    render(<TransactionsPage />);
    const checkboxes = screen.getAllByRole("checkbox");
    // First checkbox is the header "select all"
    fireEvent.click(checkboxes[0]);
    expect(screen.getByText("selected")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Approve all/ })).toBeTruthy();
  });

  it("updates the detail panel when a row is clicked", () => {
    render(<TransactionsPage />);
    fireEvent.click(screen.getByText("CAFE IMPORTS LLC"));
    // The detail panel echoes the selected transaction's ISO date + memo
    expect(screen.getByText("2026-05-22")).toBeTruthy();
    const memos = screen.getAllByText("PO 8814 — Ethiopian Yirg.");
    // appears in both the table row and the detail panel
    expect(memos.length).toBeGreaterThanOrEqual(2);
    // detail panel "Vendor / payee" label (debit transaction)
    expect(within(document.body).getByText("Vendor / payee")).toBeTruthy();
  });
});
