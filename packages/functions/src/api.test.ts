import { expect, test, vi } from "vitest";
import apiWorker, { handleApiRequest } from "./api";
import { ACCESS_TOKEN_COOKIE } from "./auth/cookies";
import { signAccessJwt } from "./auth/jwt";

test("GET /api/health returns api service status", async () => {
  const response = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/health"),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe(
    "application/json; charset=utf-8",
  );
  await expect(response.json()).resolves.toEqual({
    service: "api",
    status: "ok",
  });
});

test("default API Worker fetch wraps the testable request handler", () => {
  expect(apiWorker.fetch).not.toBe(handleApiRequest);
});

test("GET /api/me returns the current user for a valid access JWT", async () => {
  const token = await signAccessJwt({
    secret: "jwt-secret",
    userId: "user-1",
    issuedAt: new Date("2026-06-03T08:00:00.000Z"),
    expiresAt: new Date("2026-06-03T10:00:00.000Z"),
  });
  const context = createApiTestContext({
    user: publicUser(),
  });

  const response = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/me", {
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=${token}`,
      },
    }),
    context,
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
    user: publicUser(),
  });
  expect(context.repository.findPublicUserById).toHaveBeenCalledWith("user-1");
});

test("GET /api/me rejects missing and invalid access JWTs", async () => {
  const missingResponse = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/me"),
    createApiTestContext(),
  );

  expect(missingResponse.status).toBe(401);
  await expect(missingResponse.json()).resolves.toEqual({
    error: { code: "API_AUTH_REQUIRED" },
  });

  const invalidResponse = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/me", {
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=not-a-jwt`,
      },
    }),
    createApiTestContext(),
  );

  expect(invalidResponse.status).toBe(401);
  await expect(invalidResponse.json()).resolves.toEqual({
    error: { code: "API_AUTH_INVALID" },
  });
});

test("unsupported api routes return a stable error code", async () => {
  const response = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/missing"),
  );

  expect(response.status).toBe(404);
  expect(response.headers.get("content-type")).toBe(
    "application/json; charset=utf-8",
  );
  await expect(response.json()).resolves.toEqual({
    error: {
      code: "API_ROUTE_NOT_FOUND",
    },
  });
});

function createApiTestContext(options: { user?: unknown } = {}) {
  return {
    repository: {
      findPublicUserById: vi.fn().mockResolvedValue(options.user),
    },
    jwtSigningSecret: "jwt-secret",
    now: () => new Date("2026-06-03T09:00:00.000Z"),
  };
}

function publicUser() {
  return {
    id: "user-1",
    username: "RobinSrimal",
    email: "robin@example.com",
    emailVerified: true,
    membershipStatus: "pending",
    role: "user",
  };
}
