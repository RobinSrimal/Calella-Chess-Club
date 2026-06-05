import { beforeEach, describe, expect, test, vi } from "vitest";
import { logout } from "./auth-api";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("auth API helpers", () => {
  test("logs out through the same-origin auth proxy", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    const result = await logout();

    expect(result).toEqual({
      ok: true,
      data: null,
      status: 204,
    });
    expect(fetchMock).toHaveBeenCalledWith("/auth/logout", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
  });

  test("normalizes stable auth errors", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: { code: "AUTH_REFRESH_INVALID" } }, { status: 401 }),
    );

    const result = await logout();

    expect(result).toEqual({
      ok: false,
      code: "AUTH_REFRESH_INVALID",
      status: 401,
    });
  });

  test("normalizes network errors", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));

    const result = await logout();

    expect(result).toEqual({
      ok: false,
      code: "NETWORK_ERROR",
      status: 0,
    });
  });
});

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json; charset=utf-8" },
    ...init,
  });
}
