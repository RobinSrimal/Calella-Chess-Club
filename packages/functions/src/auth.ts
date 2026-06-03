import { Resource } from "sst";
import {
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
  createAccessTokenCookie,
  createRefreshTokenCookie,
  readCookie,
  REFRESH_TOKEN_COOKIE,
} from "./auth/cookies";
import { sendVerificationEmail } from "./auth/email";
import { signAccessJwt } from "./auth/jwt";
import {
  PASSWORD_HASH_ALGORITHM,
  hashPassword,
  verifyPassword,
} from "./auth/password";
import {
  type AuthRepository,
  type LoginAttemptInsert,
  type PublicUser,
  type RefreshSessionInsert,
  createD1AuthRepository,
} from "./auth/repository";
import {
  createRefreshToken,
  createVerificationToken,
  hashRefreshToken,
  hashToken,
} from "./auth/tokens";
import { parseLoginBody, parseRegisterBody } from "./auth/validation";

export type AuthHealthResponse = {
  service: "auth";
  status: "ok";
};

export type AuthErrorCode =
  | "AUTH_ACCOUNT_DISABLED"
  | "AUTH_EMAIL_SEND_FAILED"
  | "AUTH_EMAIL_NOT_VERIFIED"
  | "AUTH_EMAIL_TAKEN"
  | "AUTH_INVALID_JSON"
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_REFRESH_INVALID"
  | "AUTH_REFRESH_REQUIRED"
  | "AUTH_ROUTE_NOT_FOUND"
  | "AUTH_USERNAME_TAKEN"
  | "AUTH_VALIDATION_FAILED"
  | "AUTH_VERIFICATION_TOKEN_EXPIRED"
  | "AUTH_VERIFICATION_TOKEN_INVALID"
  | "AUTH_VERIFICATION_TOKEN_USED";

export type AuthErrorResponse = {
  error: {
    code: AuthErrorCode;
    fields?: string[];
  };
};

export type RegisterResponse = {
  user: PublicUser;
};

export type LoginResponse = {
  user: PublicUser;
};

export type VerifyEmailResponse = {
  verified: true;
  membershipStatus: "pending";
};

export type AuthContext = {
  repository: AuthRepository;
  passwordPepper: string;
  passwordHashCost?: number;
  jwtSigningSecret: string;
  refreshTokenSecret: string;
  resendApiKey: string;
  emailFrom: string;
  webOrigin: string;
  secureCookies: boolean;
  fetch: typeof fetch;
  now: () => Date;
  generateId: () => string;
  randomBytes: (length: number) => Uint8Array;
};

type JsonBody =
  | AuthHealthResponse
  | AuthErrorResponse
  | RegisterResponse
  | LoginResponse
  | VerifyEmailResponse;

const ACCESS_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export async function handleAuthRequest(
  request: Request,
  context?: AuthContext,
): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/auth/health") {
    const body: AuthHealthResponse = {
      service: "auth",
      status: "ok",
    };
    return jsonResponse(body);
  }

  if (request.method === "POST" && url.pathname === "/auth/register") {
    return register(request, context ?? createDefaultAuthContext(request));
  }

  if (request.method === "POST" && url.pathname === "/auth/login") {
    return login(request, context ?? createDefaultAuthContext(request));
  }

  if (request.method === "POST" && url.pathname === "/auth/refresh") {
    return refreshSession(request, context ?? createDefaultAuthContext(request));
  }

  if (request.method === "POST" && url.pathname === "/auth/logout") {
    return logout(request, context ?? createDefaultAuthContext(request));
  }

  if (request.method === "GET" && url.pathname === "/auth/verify-email") {
    return verifyEmail(url, context ?? createDefaultAuthContext(request));
  }

  return errorResponse("AUTH_ROUTE_NOT_FOUND", 404);
}

function jsonResponse(
  body: JsonBody,
  init: ResponseInit & { cookies?: string[] } = {},
) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  appendSetCookieHeaders(headers, init.cookies);

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

function emptyResponse(init: ResponseInit & { cookies?: string[] } = {}) {
  const headers = new Headers(init.headers);
  appendSetCookieHeaders(headers, init.cookies);

  return new Response(null, {
    ...init,
    headers,
  });
}

async function register(request: Request, context: AuthContext): Promise<Response> {
  const json = await readJson(request);
  if (!json.ok) {
    return errorResponse("AUTH_INVALID_JSON", 400);
  }

  const parsed = parseRegisterBody(json.value);
  if (!parsed.ok) {
    return errorResponse("AUTH_VALIDATION_FAILED", 400, {
      fields: parsed.fields,
    });
  }

  const body = parsed.value;
  const usernameUser = await context.repository.findUserByUsernameNormalized(
    body.usernameNormalized,
  );
  if (usernameUser) {
    return errorResponse("AUTH_USERNAME_TAKEN", 409);
  }

  const emailUser = await context.repository.findUserByEmailNormalized(
    body.emailNormalized,
  );
  if (emailUser) {
    return errorResponse("AUTH_EMAIL_TAKEN", 409);
  }

  const now = context.now();
  const nowIso = now.toISOString();
  const userId = context.generateId();
  const tokenId = context.generateId();
  const password = await hashPassword(body.password, context.passwordPepper, {
    cost: context.passwordHashCost,
  });
  const verificationToken = await createVerificationToken({
    randomBytes: context.randomBytes,
  });
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  await context.repository.createUserWithVerificationToken({
    user: {
      id: userId,
      username: body.username,
      usernameNormalized: body.usernameNormalized,
      email: body.email,
      emailNormalized: body.emailNormalized,
      passwordHash: password.hash,
      passwordHashAlgorithm: PASSWORD_HASH_ALGORITHM,
      accountStatus: "active",
      membershipStatus: "none",
      role: "user",
      emailVerifiedAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      disabledAt: null,
      disabledBy: null,
    },
    token: {
      id: tokenId,
      userId,
      tokenHash: verificationToken.tokenHash,
      expiresAt,
      usedAt: null,
      createdAt: nowIso,
    },
  });

  const emailResult = await sendVerificationEmail({
    fetch: context.fetch,
    apiKey: context.resendApiKey,
    from: context.emailFrom,
    to: body.email,
    username: body.username,
    locale: body.locale,
    webOrigin: context.webOrigin,
    token: verificationToken.token,
  });
  if (!emailResult.ok) {
    await context.repository.deleteUnverifiedUser(userId);
    return errorResponse("AUTH_EMAIL_SEND_FAILED", 502);
  }

  return jsonResponse(
    {
      user: {
        id: userId,
        username: body.username,
        email: body.email,
        emailVerified: false,
        membershipStatus: "none",
        role: "user",
      },
    },
    { status: 201 },
  );
}

async function login(request: Request, context: AuthContext): Promise<Response> {
  const json = await readJson(request);
  if (!json.ok) {
    return errorResponse("AUTH_INVALID_JSON", 400);
  }

  const parsed = parseLoginBody(json.value);
  if (!parsed.ok) {
    return errorResponse("AUTH_VALIDATION_FAILED", 400, {
      fields: parsed.fields,
    });
  }

  const body = parsed.value;
  const user = await context.repository.findUserForLogin(
    body.usernameOrEmailNormalized,
  );

  if (!user) {
    await recordLoginAttempt(context, {
      usernameOrEmail: body.usernameOrEmail,
      usernameOrEmailNormalized: body.usernameOrEmailNormalized,
      success: false,
      failureCode: "AUTH_INVALID_CREDENTIALS",
    });
    return errorResponse("AUTH_INVALID_CREDENTIALS", 401);
  }

  const passwordValid =
    user.passwordHashAlgorithm === PASSWORD_HASH_ALGORITHM &&
    (await verifyPassword(
      body.password,
      context.passwordPepper,
      user.passwordHash,
    ));
  if (!passwordValid) {
    await recordLoginAttempt(context, {
      usernameOrEmail: body.usernameOrEmail,
      usernameOrEmailNormalized: body.usernameOrEmailNormalized,
      success: false,
      failureCode: "AUTH_INVALID_CREDENTIALS",
    });
    return errorResponse("AUTH_INVALID_CREDENTIALS", 401);
  }

  if (user.accountStatus === "disabled") {
    await recordLoginAttempt(context, {
      usernameOrEmail: body.usernameOrEmail,
      usernameOrEmailNormalized: body.usernameOrEmailNormalized,
      success: false,
      failureCode: "AUTH_ACCOUNT_DISABLED",
    });
    return errorResponse("AUTH_ACCOUNT_DISABLED", 403);
  }

  if (!user.emailVerifiedAt) {
    await recordLoginAttempt(context, {
      usernameOrEmail: body.usernameOrEmail,
      usernameOrEmailNormalized: body.usernameOrEmailNormalized,
      success: false,
      failureCode: "AUTH_EMAIL_NOT_VERIFIED",
    });
    return errorResponse("AUTH_EMAIL_NOT_VERIFIED", 403);
  }

  const response = await createSessionResponse(
    context,
    user,
    request.headers.get("user-agent"),
  );

  await recordLoginAttempt(context, {
    usernameOrEmail: body.usernameOrEmail,
    usernameOrEmailNormalized: body.usernameOrEmailNormalized,
    success: true,
    failureCode: null,
  });

  return response;
}

async function refreshSession(
  request: Request,
  context: AuthContext,
): Promise<Response> {
  const refreshToken = readCookie(request, REFRESH_TOKEN_COOKIE);
  if (!refreshToken) {
    return errorResponse("AUTH_REFRESH_REQUIRED", 401);
  }

  const tokenHash = await hashRefreshToken(
    refreshToken,
    context.refreshTokenSecret,
  );
  const session = await context.repository.findRefreshSessionByTokenHash(tokenHash);
  const now = context.now();

  if (
    !session ||
    session.revokedAt ||
    session.replacedBy ||
    new Date(session.expiresAt).getTime() <= now.getTime()
  ) {
    return errorResponse("AUTH_REFRESH_INVALID", 401);
  }

  const replacement = await createRefreshSessionInsert({
    context,
    userId: session.userId,
    userAgent: request.headers.get("user-agent"),
  });
  await context.repository.rotateRefreshSession({
    currentSessionId: session.id,
    revokedAt: now.toISOString(),
    replacement: replacement.session,
  });

  const accessToken = await createAccessToken(context, session.user, now);
  return jsonResponse(
    {
      user: session.user,
    },
    {
      cookies: [
        createAccessTokenCookie(accessToken, { secure: context.secureCookies }),
        createRefreshTokenCookie(replacement.token, {
          secure: context.secureCookies,
        }),
      ],
    },
  );
}

async function logout(request: Request, context: AuthContext): Promise<Response> {
  const refreshToken = readCookie(request, REFRESH_TOKEN_COOKIE);
  if (refreshToken) {
    const tokenHash = await hashRefreshToken(
      refreshToken,
      context.refreshTokenSecret,
    );
    await context.repository.revokeRefreshSessionByTokenHash({
      tokenHash,
      revokedAt: context.now().toISOString(),
    });
  }

  return emptyResponse({
    status: 204,
    cookies: [
      clearAccessTokenCookie({ secure: context.secureCookies }),
      clearRefreshTokenCookie({ secure: context.secureCookies }),
    ],
  });
}

async function verifyEmail(
  url: URL,
  context: AuthContext,
): Promise<Response> {
  const token = url.searchParams.get("token");
  if (!token) {
    return errorResponse("AUTH_VERIFICATION_TOKEN_INVALID", 400);
  }

  const tokenHash = await hashToken(token);
  const storedToken = await context.repository.findVerificationTokenByHash(tokenHash);
  if (!storedToken) {
    return errorResponse("AUTH_VERIFICATION_TOKEN_INVALID", 400);
  }
  if (storedToken.usedAt) {
    return errorResponse("AUTH_VERIFICATION_TOKEN_USED", 409);
  }

  const now = context.now();
  if (new Date(storedToken.expiresAt).getTime() <= now.getTime()) {
    return errorResponse("AUTH_VERIFICATION_TOKEN_EXPIRED", 410);
  }

  await context.repository.markEmailVerified({
    tokenId: storedToken.id,
    userId: storedToken.userId,
    verifiedAt: now.toISOString(),
  });

  return jsonResponse({
    verified: true,
    membershipStatus: "pending",
  });
}

async function createSessionResponse(
  context: AuthContext,
  user: PublicUser,
  userAgent: string | null,
): Promise<Response> {
  const publicUser = toPublicUser(user);
  const now = context.now();
  const refresh = await createRefreshSessionInsert({
    context,
    userId: publicUser.id,
    userAgent,
  });
  await context.repository.createRefreshSession(refresh.session);

  const accessToken = await createAccessToken(context, publicUser, now);
  return jsonResponse(
    {
      user: publicUser,
    },
    {
      cookies: [
        createAccessTokenCookie(accessToken, { secure: context.secureCookies }),
        createRefreshTokenCookie(refresh.token, {
          secure: context.secureCookies,
        }),
      ],
    },
  );
}

async function createRefreshSessionInsert(input: {
  context: AuthContext;
  userId: string;
  userAgent: string | null;
}): Promise<{ token: string; session: RefreshSessionInsert }> {
  const now = input.context.now();
  const nowIso = now.toISOString();
  const token = await createRefreshToken(input.context.refreshTokenSecret, {
    randomBytes: input.context.randomBytes,
  });

  return {
    token: token.token,
    session: {
      id: input.context.generateId(),
      userId: input.userId,
      tokenHash: token.tokenHash,
      createdAt: nowIso,
      expiresAt: new Date(now.getTime() + REFRESH_TOKEN_TTL_MS).toISOString(),
      revokedAt: null,
      replacedBy: null,
      userAgent: input.userAgent,
    },
  };
}

async function createAccessToken(
  context: AuthContext,
  user: PublicUser,
  issuedAt: Date,
): Promise<string> {
  return signAccessJwt({
    secret: context.jwtSigningSecret,
    userId: user.id,
    issuedAt,
    expiresAt: new Date(issuedAt.getTime() + ACCESS_TOKEN_TTL_MS),
  });
}

async function recordLoginAttempt(
  context: AuthContext,
  input: Omit<LoginAttemptInsert, "id" | "createdAt">,
) {
  await context.repository.recordLoginAttempt({
    id: context.generateId(),
    createdAt: context.now().toISOString(),
    ...input,
  });
}

function createDefaultAuthContext(request: Request): AuthContext {
  return {
    repository: createD1AuthRepository(Resource.Database),
    passwordPepper: Resource.PasswordPepper.value,
    jwtSigningSecret: Resource.JwtSigningSecret.value,
    refreshTokenSecret: Resource.RefreshTokenSecret.value,
    resendApiKey: Resource.ResendApiKey.value,
    emailFrom: getEnv("EMAIL_FROM") ?? "Calella Chess Club <onboarding@resend.dev>",
    webOrigin: getEnv("WEB_ORIGIN") ?? new URL(request.url).origin,
    secureCookies: true,
    fetch,
    now: () => new Date(),
    generateId: () => crypto.randomUUID(),
    randomBytes(length) {
      const bytes = new Uint8Array(length);
      crypto.getRandomValues(bytes);
      return bytes;
    },
  };
}

function appendSetCookieHeaders(headers: Headers, cookies: string[] | undefined) {
  for (const cookie of cookies ?? []) {
    headers.append("set-cookie", cookie);
  }
}

function toPublicUser(user: PublicUser): PublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    emailVerified: user.emailVerified,
    membershipStatus: user.membershipStatus,
    role: user.role,
  };
}

function errorResponse(
  code: AuthErrorCode,
  status: number,
  extra: Omit<AuthErrorResponse["error"], "code"> = {},
): Response {
  return jsonResponse(
    {
      error: {
        code,
        ...extra,
      },
    },
    { status },
  );
}

async function readJson(
  request: Request,
): Promise<{ ok: true; value: unknown } | { ok: false }> {
  try {
    return { ok: true, value: await request.json() };
  } catch {
    return { ok: false };
  }
}

function getEnv(name: string): string | undefined {
  return (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env?.[name];
}

export default {
  fetch(request: Request) {
    return handleAuthRequest(request);
  },
};
