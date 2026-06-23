import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ClientSwitcher } from "./ClientSwitcher";

const clients = [
  { id: "2189", name: "Dr. Reuben Montemagni, A Chiropractic Corporation" },
  { id: "2243", name: "Amos, Jim" },
];

describe("ClientSwitcher", () => {
  it("lists clients when open", () => {
    render(
      <ClientSwitcher open onOpenChange={() => {}} clients={clients} currentId="" onSelect={() => {}} />,
    );
    expect(screen.getByText("Amos, Jim")).toBeTruthy();
    expect(screen.getByText(/Montemagni/)).toBeTruthy();
  });

  it("calls onSelect with the client id and closes on select", () => {
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ClientSwitcher open onOpenChange={onOpenChange} clients={clients} currentId="" onSelect={onSelect} />,
    );
    fireEvent.click(screen.getByText("Amos, Jim"));
    expect(onSelect).toHaveBeenCalledWith("2243");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders nothing when closed", () => {
    render(
      <ClientSwitcher open={false} onOpenChange={() => {}} clients={clients} currentId="" onSelect={() => {}} />,
    );
    expect(screen.queryByText("Amos, Jim")).toBeNull();
  });
});
