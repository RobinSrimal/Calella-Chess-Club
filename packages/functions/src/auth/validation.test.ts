import { expect, test } from "vitest";
import {
  normalizeEmail,
  normalizeUsername,
  parseLoginBody,
  parseRegisterBody,
} from "./validation";

test("normalizes usernames and emails for lookup", () => {
  expect(normalizeUsername("  RobinSrimal  ")).toBe("robinsrimal");
  expect(normalizeEmail("  ROBIN@example.COM  ")).toBe("robin@example.com");
});

test("accepts a valid register body with default locale", () => {
  const result = parseRegisterBody({
    username: "RobinSrimal",
    email: "robin@example.com",
    password: "correct horse battery staple",
  });

  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value).toEqual({
      username: "RobinSrimal",
      usernameNormalized: "robinsrimal",
      email: "robin@example.com",
      emailNormalized: "robin@example.com",
      password: "correct horse battery staple",
      locale: "ca",
    });
  }
});

test("rejects invalid register bodies with field errors", () => {
  const result = parseRegisterBody({
    username: "r",
    email: "not-an-email",
    password: "short",
    locale: "de",
  });

  expect(result).toEqual({
    ok: false,
    fields: ["username", "email", "password", "locale"],
  });
});

test("accepts and normalizes a valid login body", () => {
  const result = parseLoginBody({
    usernameOrEmail: "  ROBIN@example.COM  ",
    password: "correct horse battery staple",
  });

  expect(result).toEqual({
    ok: true,
    value: {
      usernameOrEmail: "ROBIN@example.COM",
      usernameOrEmailNormalized: "robin@example.com",
      password: "correct horse battery staple",
    },
  });
});

test("rejects invalid login bodies with field errors", () => {
  const result = parseLoginBody({
    usernameOrEmail: "",
    password: "",
  });

  expect(result).toEqual({
    ok: false,
    fields: ["usernameOrEmail", "password"],
  });
});
