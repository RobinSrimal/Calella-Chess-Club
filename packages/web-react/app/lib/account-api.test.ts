import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  approveMembership,
  disableUser,
  getCurrentUser,
  listAdminUsers,
  rejectMembership,
  restoreMembership,
  verifyEmailToken,
} from "./account-api";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("account API helpers", () => {
  test("verifies email tokens through the same-origin auth proxy", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ verified: true }));

    const result = await verifyEmailToken("raw token");

    expect(result).toEqual({
      ok: true,
      data: { verified: true },
      status: 200,
    });
    expect(fetchMock).toHaveBeenCalledWith("/auth/verify-email?token=raw+token", {
      credentials: "same-origin",
    });
  });

  test("loads the current user through the same-origin API proxy", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ user: { id: "admin-1" } }));

    const result = await getCurrentUser();

    expect(result).toEqual({
      ok: true,
      data: { user: { id: "admin-1" } },
      status: 200,
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/me", {
      credentials: "same-origin",
    });
  });

  test("serializes admin user filters", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ users: [] }));

    await listAdminUsers({
      membershipStatus: "pending",
      role: "user",
      accountStatus: "active",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/users?membershipStatus=pending&role=user&accountStatus=active",
      { credentials: "same-origin" },
    );
  });

  test("posts admin user actions with JSON empty bodies", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ user: { id: "user-1" } }));

    await approveMembership("user-1");
    await rejectMembership("user-1");
    await restoreMembership("user-1");
    await disableUser("user-1");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/admin/users/user-1/approve-membership",
      adminActionInit(),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/admin/users/user-1/reject-membership",
      adminActionInit(),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/admin/users/user-1/restore-membership",
      adminActionInit(),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "/api/admin/users/user-1/disable",
      adminActionInit(),
    );
  });

  test("encodes admin user ids in action paths", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ user: { id: "user/1" } }));

    await approveMembership("user/1");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/users/user%2F1/approve-membership",
      adminActionInit(),
    );
  });

  test("normalizes stable API error codes and fields", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { error: { code: "API_VALIDATION_FAILED", fields: ["role"] } },
        { status: 400 },
      ),
    );

    const result = await listAdminUsers({ role: "admin" });

    expect(result).toEqual({
      ok: false,
      code: "API_VALIDATION_FAILED",
      fields: ["role"],
      status: 400,
    });
  });

  test("normalizes fetch failures as network errors", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));

    const result = await getCurrentUser();

    expect(result).toEqual({
      ok: false,
      code: "NETWORK_ERROR",
      status: 0,
    });
  });
});

function adminActionInit(): RequestInit {
  return {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: "{}",
  };
}

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json; charset=utf-8" },
    ...init,
  });
}
