import type { PublicUser } from "../lib/account-api";

export function publicUser(overrides: Partial<PublicUser> = {}): PublicUser {
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
