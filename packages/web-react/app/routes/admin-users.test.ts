import { describe, expect, test } from "vitest";
import type { PublicUser } from "../lib/account-api";
import { canUseAdminUsers, loader } from "./admin-users";

describe("admin users route", () => {
  test("loads localized Catalan admin users copy", async () => {
    const data = (await loader({
      params: {},
      request: new Request("https://club.example/ca/admin/users"),
    } as never)) as any;

    expect(data.locale).toBe("ca");
    expect(data.copy.title).toBe("Gestió d'usuaris");
    expect(data.copy.filters.membershipStatus).toBe("Estat de soci");
  });

  test("allows only admins to load admin users", () => {
    expect(canUseAdminUsers(publicUser({ role: "admin" }))).toBe(true);
    expect(canUseAdminUsers(publicUser({ role: "user" }))).toBe(false);
    expect(canUseAdminUsers(null)).toBe(false);
  });
});

function publicUser(overrides: Partial<PublicUser> = {}): PublicUser {
  return {
    id: "user-1",
    username: "User",
    email: "user@example.com",
    emailVerified: true,
    membershipStatus: "member",
    role: "user",
    ...overrides,
  };
}
