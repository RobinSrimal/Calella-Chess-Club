import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router";

export function renderWithRouter(
  ui: ReactElement,
  {
    initialEntries = ["/ca"],
    ...options
  }: RenderOptions & { initialEntries?: string[] } = {},
) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>,
    options,
  );
}
