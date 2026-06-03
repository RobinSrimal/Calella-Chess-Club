import { Resource } from "sst";
import { sendVerificationEmail } from "./auth/email";
import {
  PASSWORD_HASH_ALGORITHM,
  hashPassword,
} from "./auth/password";
import {
  type AuthRepository,
  type PublicUser,
  createD1AuthRepository,
} from "./auth/repository";
import { createVerificationToken, hashToken } from "./auth/tokens";
import { parseRegisterBody } from "./auth/validation";

type AuthSecretResources = typeof Resource & {
  PasswordPepper: { value: string };
  ResendApiKey: { value: string };
};

export type AuthHealthResponse = {
  service: "auth";
  status: "ok";
};

export type AuthErrorCode =
  | "AUTH_EMAIL_SEND_FAILED"
  | "AUTH_EMAIL_TAKEN"
  | "AUTH_INVALID_JSON"
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

export type VerifyEmailResponse = {
  verified: true;
  membershipStatus: "pending";
};

export type AuthContext = {
  repository: AuthRepository;
  passwordPepper: string;
  passwordHashCost?: number;
  resendApiKey: string;
  emailFrom: string;
  webOrigin: string;
  fetch: typeof fetch;
  now: () => Date;
  generateId: () => string;
  randomBytes: (length: number) => Uint8Array;
};

type JsonBody =
  | AuthHealthResponse
  | AuthErrorResponse
  | RegisterResponse
  | VerifyEmailResponse;

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

  if (request.method === "GET" && url.pathname === "/auth/verify-email") {
    return verifyEmail(url, context ?? createDefaultAuthContext(request));
  }

  return errorResponse("AUTH_ROUTE_NOT_FOUND", 404);
}

function jsonResponse(body: JsonBody, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(body), {
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

function createDefaultAuthContext(request: Request): AuthContext {
  const resource = Resource as AuthSecretResources;

  return {
    repository: createD1AuthRepository(Resource.Database),
    passwordPepper: resource.PasswordPepper.value,
    resendApiKey: resource.ResendApiKey.value,
    emailFrom: getEnv("EMAIL_FROM") ?? "Calella Chess Club <onboarding@resend.dev>",
    webOrigin: getEnv("WEB_ORIGIN") ?? new URL(request.url).origin,
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
  fetch: handleAuthRequest,
};
