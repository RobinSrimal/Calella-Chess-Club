import { describe, expect, test } from "vitest";
import type { PublicUser } from "../lib/account-api";
import { displayUsername } from "./SiteHeader";

describe("SiteHeader helpers", () => {
  test("uses the username when it is present", () => {
    expect(
      displayUsername(
        publicUser({ username: "RobinSrimal", email: "robin@example.com" }),
      ),
    ).toBe("RobinSrimal");
  });

  test("falls back to email when the username is blank", () => {
    expect(
      displayUsername(publicUser({ username: "", email: "robin@example.com" })),
    ).toBe("robin@example.com");
  });
});

function publicUser(overrides: Partial<PublicUser>): PublicUser {
  return {
    id: "user-1",
    username: "member",
    email: "member@example.com",
    emailVerified: true,
    membershipStatus: "member",
    role: "user",
    ...overrides,
  };
}
