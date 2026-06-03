import { expect, test } from "vitest";
import { publicAuthNavLinks } from "./public-auth-nav-state";

const labels = {
  login: "Log in",
  register: "Register",
  member: "Members",
  admin: "Admin",
};

test("returns public auth links before a user is loaded", () => {
  expect(publicAuthNavLinks(null, "ca", labels)).toEqual([
    { href: "/ca/login", label: "Log in" },
    { href: "/ca/register", label: "Register" },
  ]);
});

test("returns the member link for a logged-in non-admin user", () => {
  expect(
    publicAuthNavLinks(
      {
        id: "user-1",
        username: "anna",
        email: "anna@example.com",
        emailVerified: true,
        membershipStatus: "member",
        role: "user",
      },
      "en",
      labels,
    ),
  ).toEqual([{ href: "/en/member", label: "Members" }]);
});

test("returns the admin link for a logged-in admin user", () => {
  expect(
    publicAuthNavLinks(
      {
        id: "user-1",
        username: "admin",
        email: "admin@example.com",
        emailVerified: true,
        membershipStatus: "member",
        role: "admin",
      },
      "es",
      labels,
    ),
  ).toEqual([{ href: "/es/admin", label: "Admin" }]);
});
