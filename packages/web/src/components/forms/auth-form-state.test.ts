import { expect, test } from "vitest";
import { messageForErrorCode, redirectPathForUser } from "./auth-form-state";

test("selects an English message for stable error codes", () => {
  expect(messageForErrorCode("AUTH_INVALID_CREDENTIALS")).toBe(
    "Username or password is incorrect.",
  );
});

test("falls back to an English generic message for unknown error codes", () => {
  expect(messageForErrorCode("SOMETHING_ELSE")).toBe(
    "Could not complete the request.",
  );
});

test("routes admins to the member area after login", () => {
  expect(
    redirectPathForUser(
      {
        id: "admin-1",
        username: "admin",
        email: "admin@example.com",
        emailVerified: true,
        membershipStatus: "member",
        role: "admin",
      },
      "ca",
    ),
  ).toBe("/ca/member");
});

test("routes non-admin users to the member area after login", () => {
  expect(
    redirectPathForUser(
      {
        id: "user-1",
        username: "anna",
        email: "anna@example.com",
        emailVerified: true,
        membershipStatus: "pending",
        role: "user",
      },
      "en",
    ),
  ).toBe("/en/member");
});
