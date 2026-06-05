// @vitest-environment jsdom

import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { getCurrentUser } from "../lib/account-api";
import { logout } from "../lib/auth-api";
import { renderWithRouter } from "../test/render";
import { publicUser } from "../test/users";
import { SiteHeader } from "./SiteHeader";

vi.mock("../lib/account-api", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("../lib/auth-api", () => ({
  logout: vi.fn(),
}));

const getCurrentUserMock = vi.mocked(getCurrentUser);
const logoutMock = vi.mocked(logout);

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("SiteHeader rendered navigation", () => {
  test("shows public navigation when logged out", async () => {
    getCurrentUserMock.mockResolvedValueOnce({
      ok: false,
      code: "API_AUTH_REQUIRED",
      status: 401,
    });

    renderHeader();

    expect(screen.getByRole("link", { name: "Inici" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Entrar" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Registrar-se" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "CA" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ES" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "EN" })).toBeInTheDocument();

    await waitFor(() => expect(getCurrentUserMock).toHaveBeenCalledOnce());

    expect(screen.queryByRole("link", { name: "Membres" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Admin" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Sortir" })).toBeNull();
    expect(screen.queryByText("member")).toBeNull();
  });

  test("shows member navigation and hides auth links for logged-in members", async () => {
    getCurrentUserMock.mockResolvedValueOnce({
      ok: true,
      data: {
        user: publicUser({ username: "RobinSrimal", role: "user" }),
      },
      status: 200,
    });

    renderHeader();

    expect(await screen.findByText("RobinSrimal")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Inici" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Membres" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sortir" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Admin" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Entrar" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Registrar-se" })).toBeNull();
  });

  test("shows admin navigation for logged-in admins", async () => {
    getCurrentUserMock.mockResolvedValueOnce({
      ok: true,
      data: {
        user: publicUser({ username: "AdminUser", role: "admin" }),
      },
      status: 200,
    });

    renderHeader();

    expect(await screen.findByText("AdminUser")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Inici" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Membres" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Admin" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sortir" })).toBeInTheDocument();
  });

  test("logs out, clears local session state, and navigates home", async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    let resolveLogout: (value: { ok: true; data: null; status: 204 }) => void;

    getCurrentUserMock.mockResolvedValueOnce({
      ok: true,
      data: {
        user: publicUser({ username: "RobinSrimal", role: "user" }),
      },
      status: 200,
    });
    logoutMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveLogout = resolve;
      }),
    );

    renderHeader({ navigate });

    expect(await screen.findByText("RobinSrimal")).toBeInTheDocument();

    const logoutButton = screen.getByRole("button", { name: "Sortir" });
    await user.click(logoutButton);

    expect(logoutMock).toHaveBeenCalledOnce();
    expect(logoutButton).toBeDisabled();

    resolveLogout!({ ok: true, data: null, status: 204 });

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/ca"));
    expect(screen.queryByText("RobinSrimal")).toBeNull();
  });
});

function renderHeader({
  navigate = vi.fn(),
}: {
  navigate?: (path: string) => void;
} = {}) {
  return renderWithRouter(
    <SiteHeader
      activeSection="public"
      languagePath={(locale) => `/${locale}`}
      locale="ca"
      navigate={navigate}
    />,
  );
}
