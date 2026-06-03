import { expect, test, vi } from "vitest";
import authWorker, { handleAuthRequest } from "./auth";
import { verifyPassword } from "./auth/password";

test("GET /auth/health returns auth service status", async () => {
  const response = await handleAuthRequest(
    new Request("https://calella-chess-club.test/auth/health"),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe(
    "application/json; charset=utf-8",
  );
  await expect(response.json()).resolves.toEqual({
    service: "auth",
    status: "ok",
  });
});

test("default Worker fetch wraps the testable request handler", () => {
  expect(authWorker.fetch).not.toBe(handleAuthRequest);
});

test("unsupported auth routes return a stable error code", async () => {
  const response = await handleAuthRequest(
    new Request("https://calella-chess-club.test/auth/login", {
      method: "POST",
    }),
  );

  expect(response.status).toBe(404);
  expect(response.headers.get("content-type")).toBe(
    "application/json; charset=utf-8",
  );
  await expect(response.json()).resolves.toEqual({
    error: {
      code: "AUTH_ROUTE_NOT_FOUND",
    },
  });
});

test("POST /auth/register creates an unverified user and sends a verification email", async () => {
  const context = createAuthTestContext();
  const response = await handleAuthRequest(
    jsonRequest("/auth/register", {
      username: "RobinSrimal",
      email: "robin@example.com",
      password: "correct horse battery staple",
      locale: "en",
    }),
    context,
  );

  expect(response.status).toBe(201);
  await expect(response.json()).resolves.toEqual({
    user: {
      id: "id-1",
      username: "RobinSrimal",
      email: "robin@example.com",
      emailVerified: false,
      membershipStatus: "none",
      role: "user",
    },
  });
  expect(context.repository.createUserWithVerificationToken).toHaveBeenCalledOnce();
  const created = context.repository.createUserWithVerificationToken.mock.calls[0][0];
  expect(created).toMatchObject({
    user: {
      id: "id-1",
      username: "RobinSrimal",
      usernameNormalized: "robinsrimal",
      email: "robin@example.com",
      emailNormalized: "robin@example.com",
      passwordHashAlgorithm: "bcrypt-sha256-pepper",
      accountStatus: "active",
      membershipStatus: "none",
      role: "user",
      emailVerifiedAt: null,
      disabledAt: null,
      disabledBy: null,
      createdAt: "2026-06-03T08:00:00.000Z",
      updatedAt: "2026-06-03T08:00:00.000Z",
    },
    token: {
      id: "id-2",
      userId: "id-1",
      expiresAt: "2026-06-04T08:00:00.000Z",
      usedAt: null,
      createdAt: "2026-06-03T08:00:00.000Z",
    },
  });
  expect(created.user.passwordHash).not.toContain("correct horse battery staple");
  await expect(
    verifyPassword(
      "correct horse battery staple",
      "pepper-secret",
      created.user.passwordHash,
    ),
  ).resolves.toBe(true);
  expect(created.token.tokenHash).not.toBe("raw-token");
  expect(context.fetch).toHaveBeenCalledOnce();
});

test("POST /auth/register rejects duplicate usernames and emails", async () => {
  const usernameContext = createAuthTestContext({
    existingUsername: { id: "existing-user" },
  });
  const usernameResponse = await handleAuthRequest(
    jsonRequest("/auth/register", validRegisterBody()),
    usernameContext,
  );

  expect(usernameResponse.status).toBe(409);
  await expect(usernameResponse.json()).resolves.toEqual({
    error: { code: "AUTH_USERNAME_TAKEN" },
  });

  const emailContext = createAuthTestContext({
    existingEmail: { id: "existing-user" },
  });
  const emailResponse = await handleAuthRequest(
    jsonRequest("/auth/register", validRegisterBody()),
    emailContext,
  );

  expect(emailResponse.status).toBe(409);
  await expect(emailResponse.json()).resolves.toEqual({
    error: { code: "AUTH_EMAIL_TAKEN" },
  });
});

test("POST /auth/register rejects invalid request bodies and email send failures", async () => {
  const invalidJsonResponse = await handleAuthRequest(
    new Request("https://calella-chess-club.test/auth/register", {
      method: "POST",
      body: "{",
    }),
    createAuthTestContext(),
  );

  expect(invalidJsonResponse.status).toBe(400);
  await expect(invalidJsonResponse.json()).resolves.toEqual({
    error: { code: "AUTH_INVALID_JSON" },
  });

  const invalidBodyResponse = await handleAuthRequest(
    jsonRequest("/auth/register", {
      username: "r",
      email: "bad-email",
      password: "short",
    }),
    createAuthTestContext(),
  );

  expect(invalidBodyResponse.status).toBe(400);
  await expect(invalidBodyResponse.json()).resolves.toEqual({
    error: {
      code: "AUTH_VALIDATION_FAILED",
      fields: ["username", "email", "password"],
    },
  });

  const emailFailureContext = createAuthTestContext({
    fetchResponse: new Response("bad request", { status: 400 }),
  });
  const emailFailureResponse = await handleAuthRequest(
    jsonRequest("/auth/register", validRegisterBody()),
    emailFailureContext,
  );

  expect(emailFailureResponse.status).toBe(502);
  await expect(emailFailureResponse.json()).resolves.toEqual({
    error: { code: "AUTH_EMAIL_SEND_FAILED" },
  });
  expect(emailFailureContext.repository.deleteUnverifiedUser).toHaveBeenCalledWith(
    "id-1",
  );
});

test("GET /auth/verify-email marks valid tokens as pending membership", async () => {
  const context = createAuthTestContext({
    verificationToken: {
      id: "token-id",
      userId: "user-id",
      expiresAt: "2026-06-04T08:00:00.000Z",
      usedAt: null,
    },
  });
  const response = await handleAuthRequest(
    new Request("https://calella-chess-club.test/auth/verify-email?token=raw-token"),
    context,
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
    verified: true,
    membershipStatus: "pending",
  });
  expect(context.repository.markEmailVerified).toHaveBeenCalledWith({
    tokenId: "token-id",
    userId: "user-id",
    verifiedAt: "2026-06-03T08:00:00.000Z",
  });
});

test("GET /auth/verify-email rejects invalid, used, and expired tokens", async () => {
  const invalidResponse = await handleAuthRequest(
    new Request("https://calella-chess-club.test/auth/verify-email?token=missing"),
    createAuthTestContext(),
  );

  expect(invalidResponse.status).toBe(400);
  await expect(invalidResponse.json()).resolves.toEqual({
    error: { code: "AUTH_VERIFICATION_TOKEN_INVALID" },
  });

  const usedResponse = await handleAuthRequest(
    new Request("https://calella-chess-club.test/auth/verify-email?token=used"),
    createAuthTestContext({
      verificationToken: {
        id: "token-id",
        userId: "user-id",
        expiresAt: "2026-06-04T08:00:00.000Z",
        usedAt: "2026-06-03T08:00:00.000Z",
      },
    }),
  );

  expect(usedResponse.status).toBe(409);
  await expect(usedResponse.json()).resolves.toEqual({
    error: { code: "AUTH_VERIFICATION_TOKEN_USED" },
  });

  const expiredResponse = await handleAuthRequest(
    new Request("https://calella-chess-club.test/auth/verify-email?token=expired"),
    createAuthTestContext({
      verificationToken: {
        id: "token-id",
        userId: "user-id",
        expiresAt: "2026-06-02T08:00:00.000Z",
        usedAt: null,
      },
    }),
  );

  expect(expiredResponse.status).toBe(410);
  await expect(expiredResponse.json()).resolves.toEqual({
    error: { code: "AUTH_VERIFICATION_TOKEN_EXPIRED" },
  });
});

function jsonRequest(path: string, body: unknown): Request {
  return new Request(`https://calella-chess-club.test${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function validRegisterBody() {
  return {
    username: "RobinSrimal",
    email: "robin@example.com",
    password: "correct horse battery staple",
    locale: "ca",
  };
}

function createAuthTestContext(options: {
  existingUsername?: unknown;
  existingEmail?: unknown;
  verificationToken?: unknown;
  fetchResponse?: Response;
} = {}) {
  let idCount = 0;
  const repository = {
    findUserByUsernameNormalized: vi.fn().mockResolvedValue(options.existingUsername),
    findUserByEmailNormalized: vi.fn().mockResolvedValue(options.existingEmail),
    createUserWithVerificationToken: vi.fn().mockResolvedValue(undefined),
    deleteUnverifiedUser: vi.fn().mockResolvedValue(undefined),
    findVerificationTokenByHash: vi.fn().mockResolvedValue(options.verificationToken),
    markEmailVerified: vi.fn().mockResolvedValue(undefined),
  };

  return {
    repository,
    passwordPepper: "pepper-secret",
    passwordHashCost: 4,
    resendApiKey: "resend-secret",
    emailFrom: "Calella Chess Club <noreply@example.com>",
    webOrigin: "https://club.example",
    fetch: vi.fn().mockResolvedValue(options.fetchResponse ?? new Response("{}", { status: 200 })),
    now: () => new Date("2026-06-03T08:00:00.000Z"),
    generateId: () => {
      idCount += 1;
      return `id-${idCount}`;
    },
    randomBytes(length: number) {
      return new Uint8Array(Array.from({ length }, (_, index) => index));
    },
  };
}
