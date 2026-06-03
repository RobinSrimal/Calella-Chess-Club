import { expect, test } from "vitest";
import type { PublicUser } from "../../lib/browser-api";
import { memberAdminNavLinks } from "./member-admin-nav-state";

const labels = {
  admin: "Admin",
};

test("returns no links before a user is loaded", () => {
  expect(memberAdminNavLinks(null, "ca", labels)).toEqual([]);
});

test("returns no links for non-admin members", () => {
  expect(memberAdminNavLinks(user({ role: "user", membershipStatus: "member" }), "ca", labels)).toEqual(
    [],
  );
});

test("returns an admin link for admins in the member area", () => {
  expect(memberAdminNavLinks(user({ role: "admin" }), "en", labels)).toEqual([
    { href: "/en/admin", label: "Admin" },
  ]);
});

function user(overrides: Partial<PublicUser> = {}): PublicUser {
  return {
    id: "user-1",
    username: "anna",
    email: "anna@example.com",
    emailVerified: true,
    membershipStatus: "member",
    role: "user",
    ...overrides,
  };
}
