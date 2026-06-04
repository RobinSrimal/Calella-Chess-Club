import { describe, expect, test } from "vitest";
import type { AdminUserSummary } from "./account-api";
import {
  messageForAdminUserErrorCode,
  sortAdminUsers,
  visibleAdminUserActions,
} from "./admin-users-state";

describe("admin user state helpers", () => {
  test("sorts active pending requests first and disabled users last", () => {
    const users = [
      adminUser({ username: "Zulu", role: "user", membershipStatus: "member" }),
      adminUser({
        username: "Bravo",
        role: "user",
        membershipStatus: "pending",
      }),
      adminUser({
        username: "Alpha",
        role: "user",
        membershipStatus: "pending",
      }),
      adminUser({
        username: "Delta",
        role: "user",
        membershipStatus: "none",
      }),
      adminUser({
        username: "Charlie",
        role: "user",
        membershipStatus: "rejected",
      }),
      adminUser({
        username: "Echo",
        role: "admin",
        membershipStatus: "member",
      }),
      adminUser({
        username: "Foxtrot",
        accountStatus: "disabled",
        membershipStatus: "pending",
      }),
    ];

    expect(sortAdminUsers(users).map((user) => user.username)).toEqual([
      "Alpha",
      "Bravo",
      "Delta",
      "Charlie",
      "Zulu",
      "Echo",
      "Foxtrot",
    ]);
  });

  test("shows membership request actions and disable for other active users", () => {
    expect(
      visibleAdminUserActions(
        adminUser({ id: "user-1", membershipStatus: "pending" }),
        "admin-1",
      ),
    ).toEqual(["approve-membership", "reject-membership", "disable"]);
  });

  test("shows restore for rejected users", () => {
    expect(
      visibleAdminUserActions(
        adminUser({ id: "user-1", membershipStatus: "rejected" }),
        "admin-1",
      ),
    ).toEqual(["restore-membership", "disable"]);
  });

  test("hides membership actions for disabled users", () => {
    expect(
      visibleAdminUserActions(
        adminUser({
          id: "user-1",
          accountStatus: "disabled",
          membershipStatus: "pending",
        }),
        "admin-1",
      ),
    ).toEqual([]);
  });

  test("hides disable for the current admin", () => {
    expect(
      visibleAdminUserActions(
        adminUser({
          id: "admin-1",
          role: "admin",
          membershipStatus: "member",
        }),
        "admin-1",
      ),
    ).toEqual([]);
  });

  test("maps stable API error codes to English messages", () => {
    expect(messageForAdminUserErrorCode("API_AUTH_REQUIRED")).toBe(
      "Log in before using the admin area.",
    );
    expect(messageForAdminUserErrorCode("API_AUTH_INVALID")).toBe(
      "Your session has expired. Log in again.",
    );
    expect(messageForAdminUserErrorCode("API_FORBIDDEN")).toBe(
      "Only active admins can manage users.",
    );
    expect(messageForAdminUserErrorCode("API_USER_NOT_FOUND")).toBe(
      "The selected user no longer exists.",
    );
    expect(messageForAdminUserErrorCode("API_VALIDATION_FAILED")).toBe(
      "The request contains invalid filter values.",
    );
    expect(messageForAdminUserErrorCode("NETWORK_ERROR")).toBe(
      "Network error. Check your connection and try again.",
    );
    expect(messageForAdminUserErrorCode("OTHER")).toBe(
      "Unexpected admin user error.",
    );
  });
});

function adminUser(
  overrides: Partial<AdminUserSummary> = {},
): AdminUserSummary {
  return {
    id: "user-id",
    username: "User",
    email: "user@example.com",
    emailVerified: true,
    membershipStatus: "none",
    role: "user",
    accountStatus: "active",
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-06-01T09:00:00.000Z",
    disabledAt: null,
    disabledBy: null,
    ...overrides,
  };
}
