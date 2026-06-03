import { expect, test } from "vitest";
import type { AdminUserSummary, PublicUser } from "../../lib/browser-api";
import {
  adminUserActions,
  canUseAdminUsers,
  messageForAdminUserErrorCode,
  sortedAdminUsers,
} from "./admin-users-state";

test("sortedAdminUsers puts active pending requests first and disabled users last", () => {
  const users = sortedAdminUsers([
    adminUser({
      id: "disabled",
      accountStatus: "disabled",
      membershipStatus: "pending",
      updatedAt: "2026-06-03T12:00:00.000Z",
    }),
    adminUser({
      id: "member",
      membershipStatus: "member",
      updatedAt: "2026-06-03T11:00:00.000Z",
    }),
    adminUser({
      id: "pending-newer",
      membershipStatus: "pending",
      updatedAt: "2026-06-03T10:00:00.000Z",
    }),
    adminUser({
      id: "none",
      membershipStatus: "none",
      updatedAt: "2026-06-03T09:00:00.000Z",
    }),
    adminUser({
      id: "pending-older",
      membershipStatus: "pending",
      updatedAt: "2026-06-03T08:00:00.000Z",
    }),
  ]);

  expect(users.map((user) => user.id)).toEqual([
    "pending-newer",
    "pending-older",
    "none",
    "member",
    "disabled",
  ]);
});

test("adminUserActions exposes membership actions only for active matching states", () => {
  expect(adminUserActions(adminUser({ membershipStatus: "pending" }), "admin-1")).toEqual({
    canApprove: true,
    canReject: true,
    canRestore: false,
    canDisable: true,
  });
  expect(adminUserActions(adminUser({ membershipStatus: "rejected" }), "admin-1")).toEqual({
    canApprove: true,
    canReject: false,
    canRestore: true,
    canDisable: true,
  });
  expect(adminUserActions(adminUser({ membershipStatus: "member" }), "admin-1")).toEqual({
    canApprove: false,
    canReject: false,
    canRestore: false,
    canDisable: true,
  });
  expect(
    adminUserActions(
      adminUser({ accountStatus: "disabled", membershipStatus: "pending" }),
      "admin-1",
    ),
  ).toEqual({
    canApprove: false,
    canReject: false,
    canRestore: false,
    canDisable: false,
  });
});

test("adminUserActions prevents current admin self-disable", () => {
  expect(adminUserActions(adminUser({ id: "admin-1" }), "admin-1").canDisable).toBe(
    false,
  );
});

test("canUseAdminUsers allows admins only", () => {
  expect(canUseAdminUsers(publicUser({ role: "admin" }))).toBe(true);
  expect(canUseAdminUsers(publicUser({ role: "user", membershipStatus: "member" }))).toBe(
    false,
  );
  expect(canUseAdminUsers(undefined)).toBe(false);
});

test("messageForAdminUserErrorCode returns stable English-only messages", () => {
  expect(messageForAdminUserErrorCode("API_FORBIDDEN")).toBe(
    "You need admin access to manage users.",
  );
  expect(messageForAdminUserErrorCode("API_USER_NOT_FOUND")).toBe(
    "Could not find that user.",
  );
  expect(messageForAdminUserErrorCode("UNKNOWN")).toBe(
    "Could not complete the request.",
  );
});

function adminUser(overrides: Partial<AdminUserSummary> = {}): AdminUserSummary {
  return {
    id: "user-1",
    username: "anna",
    email: "anna@example.com",
    emailVerified: true,
    membershipStatus: "pending",
    role: "user",
    accountStatus: "active",
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-06-01T09:00:00.000Z",
    disabledAt: null,
    disabledBy: null,
    ...overrides,
  };
}

function publicUser(overrides: Partial<PublicUser> = {}): PublicUser {
  return {
    id: "user-1",
    username: "anna",
    email: "anna@example.com",
    emailVerified: true,
    membershipStatus: "pending",
    role: "user",
    ...overrides,
  };
}
