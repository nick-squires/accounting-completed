import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Button } from "./button";

it("renders the primary variant with its label", () => {
  render(<Button variant="primary">Share</Button>);
  expect(screen.getByRole("button", { name: "Share" })).toBeTruthy();
});
