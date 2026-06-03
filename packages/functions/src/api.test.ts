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

test("GET /api/admin/users returns filtered admin user summaries for admins", async () => {
  const token = await accessTokenFor("admin-1");
  const context = createApiTestContext({
    currentUser: adminCurrentUser(),
    adminUsers: [adminUserSummary()],
  });

  const response = await handleApiRequest(
    new Request(
      "https://calella-chess-club.test/api/admin/users?membershipStatus=pending&role=user&accountStatus=active",
      {
        headers: {
          cookie: `${ACCESS_TOKEN_COOKIE}=${token}`,
        },
      },
    ),
    context,
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
    users: [adminUserSummary()],
  });
  expect(context.repository.listAdminUsers).toHaveBeenCalledWith({
    membershipStatus: "pending",
    role: "user",
    accountStatus: "active",
  });
});

test("GET /api/admin/users rejects invalid filters", async () => {
  const response = await handleApiRequest(
    new Request(
      "https://calella-chess-club.test/api/admin/users?membershipStatus=bad",
      {
        headers: {
          cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("admin-1")}`,
        },
      },
    ),
    createApiTestContext({
      currentUser: adminCurrentUser(),
    }),
  );

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: {
      code: "API_VALIDATION_FAILED",
      fields: ["membershipStatus"],
    },
  });
});

test("admin routes require a valid active admin user", async () => {
  const missingResponse = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/admin/users"),
    createApiTestContext(),
  );

  expect(missingResponse.status).toBe(401);
  await expect(missingResponse.json()).resolves.toEqual({
    error: { code: "API_AUTH_REQUIRED" },
  });

  const invalidResponse = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/admin/users", {
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

  const memberResponse = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/admin/users", {
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("user-1")}`,
      },
    }),
    createApiTestContext({
      currentUser: {
        ...currentUser(),
        role: "user",
      },
    }),
  );

  expect(memberResponse.status).toBe(403);
  await expect(memberResponse.json()).resolves.toEqual({
    error: { code: "API_FORBIDDEN" },
  });

  const disabledAdminResponse = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/admin/users", {
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=${await accessTokenFor("admin-1")}`,
      },
    }),
    createApiTestContext({
      currentUser: {
        ...adminCurrentUser(),
        accountStatus: "disabled",
      },
    }),
  );

  expect(disabledAdminResponse.status).toBe(403);
  await expect(disabledAdminResponse.json()).resolves.toEqual({
    error: { code: "API_FORBIDDEN" },
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

function createApiTestContext(options: {
  user?: unknown;
  currentUser?: unknown;
  adminUsers?: unknown[];
} = {}) {
  return {
    repository: {
      findPublicUserById: vi.fn().mockResolvedValue(options.user),
      findCurrentUserById: vi.fn().mockResolvedValue(options.currentUser),
      listAdminUsers: vi.fn().mockResolvedValue(options.adminUsers ?? []),
    },
    jwtSigningSecret: "jwt-secret",
    now: () => new Date("2026-06-03T09:00:00.000Z"),
  };
}

function accessTokenFor(userId: string) {
  return signAccessJwt({
    secret: "jwt-secret",
    userId,
    issuedAt: new Date("2026-06-03T08:00:00.000Z"),
    expiresAt: new Date("2026-06-03T10:00:00.000Z"),
  });
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

function currentUser() {
  return {
    ...publicUser(),
    accountStatus: "active",
    emailVerifiedAt: "2026-06-03T08:00:00.000Z",
  };
}

function adminCurrentUser() {
  return {
    ...currentUser(),
    id: "admin-1",
    role: "admin",
  };
}

function adminUserSummary() {
  return {
    ...publicUser(),
    accountStatus: "active",
    createdAt: "2026-06-03T08:00:00.000Z",
    updatedAt: "2026-06-03T08:00:00.000Z",
    disabledAt: null,
    disabledBy: null,
  };
}
