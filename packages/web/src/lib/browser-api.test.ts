import { expect, test } from "vitest";
import { getCurrentUser, loginUser, registerUser } from "./browser-api";

test("registerUser posts registration data with same-origin credentials", async () => {
  const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
  const fetchFn = async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ input, init });
    return Response.json(
      {
        user: {
          id: "user-1",
          username: "anna",
          email: "anna@example.com",
          emailVerified: false,
          membershipStatus: "none",
          role: "user",
        },
      },
      { status: 201 },
    );
  };

  const result = await registerUser(
    {
      username: "anna",
      email: "anna@example.com",
      password: "password123",
      locale: "ca",
    },
    fetchFn,
  );

  expect(result.ok).toBe(true);
  expect(requests).toHaveLength(1);
  expect(requests[0].input).toBe("/auth/register");
  expect(requests[0].init?.method).toBe("POST");
  expect(requests[0].init?.credentials).toBe("same-origin");
  expect(requests[0].init?.headers).toEqual({
    "content-type": "application/json",
  });
  expect(JSON.parse(String(requests[0].init?.body))).toEqual({
    username: "anna",
    email: "anna@example.com",
    password: "password123",
    locale: "ca",
  });
});

test("loginUser normalizes stable auth error responses", async () => {
  const result = await loginUser(
    { usernameOrEmail: "anna", password: "wrong-password" },
    async () =>
      Response.json(
        { error: { code: "AUTH_INVALID_CREDENTIALS" } },
        { status: 401 },
      ),
  );

  expect(result).toEqual({
    ok: false,
    status: 401,
    code: "AUTH_INVALID_CREDENTIALS",
    fields: [],
  });
});

test("loginUser posts usernameOrEmail with same-origin credentials", async () => {
  const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];

  await loginUser(
    { usernameOrEmail: "anna@example.com", password: "password123" },
    async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({ input, init });
      return Response.json({
        user: {
          id: "user-1",
          username: "anna",
          email: "anna@example.com",
          emailVerified: true,
          membershipStatus: "member",
          role: "user",
        },
      });
    },
  );

  expect(requests).toHaveLength(1);
  expect(requests[0].input).toBe("/auth/login");
  expect(requests[0].init?.method).toBe("POST");
  expect(requests[0].init?.credentials).toBe("same-origin");
  expect(JSON.parse(String(requests[0].init?.body))).toEqual({
    usernameOrEmail: "anna@example.com",
    password: "password123",
  });
});

test("getCurrentUser reads /api/me with same-origin credentials", async () => {
  const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
  const fetchFn = async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ input, init });
    return Response.json({
      user: {
        id: "user-1",
        username: "admin",
        email: "admin@example.com",
        emailVerified: true,
        membershipStatus: "member",
        role: "admin",
      },
    });
  };

  const result = await getCurrentUser(fetchFn);

  expect(result.ok).toBe(true);
  expect(requests).toEqual([
    {
      input: "/api/me",
      init: {
        method: "GET",
        credentials: "same-origin",
      },
    },
  ]);
});

test("returns a client error when fetch fails before a response is available", async () => {
  const result = await loginUser(
    { usernameOrEmail: "anna", password: "password123" },
    async () => {
      throw new Error("network failed");
    },
  );

  expect(result).toEqual({
    ok: false,
    status: 0,
    code: "WEB_REQUEST_FAILED",
    fields: [],
  });
});
