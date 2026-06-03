import { fileURLToPath } from "node:url";
import { Buffer } from "node:buffer";
import { webcrypto } from "node:crypto";
import bcrypt from "bcryptjs";
import { Resource } from "sst";

const PASSWORD = "correct horse battery staple";
const HASH_ALGORITHM = "bcrypt-sha256-pepper";

export type LiveWebAuthCheckResult = {
  username: string;
  loginStatus: number;
  meStatus: number;
};

export type LiveWebAuthCheckInput = {
  webOrigin: string;
  now: () => Date;
  suffix: () => string;
  hashPassword: (password: string) => Promise<string>;
  queryD1: (sql: string, params?: string[]) => Promise<unknown[]>;
  fetch: typeof fetch;
};

export async function runLiveWebAuthCheck(
  input: LiveWebAuthCheckInput,
): Promise<LiveWebAuthCheckResult> {
  const suffix = input.suffix();
  const userId = `live-web-auth-${suffix}`;
  const username = `liveweb${suffix}`;
  const normalizedUsername = username.toLowerCase();
  const email = `${normalizedUsername}@example.invalid`;
  const nowIso = input.now().toISOString();
  const passwordHash = await input.hashPassword(PASSWORD);

  try {
    await input.queryD1(
      [
        "INSERT INTO users (",
        "id, username, username_normalized, email, email_normalized,",
        "password_hash, password_hash_algorithm, account_status, membership_status, role,",
        "email_verified_at, created_at, updated_at, disabled_at, disabled_by",
        ") VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 'member', 'user', ?, ?, ?, NULL, NULL)",
      ].join(" "),
      [
        userId,
        username,
        normalizedUsername,
        email,
        email,
        passwordHash,
        HASH_ALGORITHM,
        nowIso,
        nowIso,
        nowIso,
      ],
    );

    const loginResponse = await input.fetch(`${input.webOrigin}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ usernameOrEmail: username, password: PASSWORD }),
    });
    const loginBody = await readJson(loginResponse);
    if (loginResponse.status !== 200) {
      throw new Error(
        `Login failed: ${loginResponse.status} ${JSON.stringify(loginBody)}`,
      );
    }

    const cookieHeader = cookieHeaderForRequest(loginResponse.headers);
    if (!cookieHeader.includes("ccc_access_token=")) {
      throw new Error("Login response did not include an access cookie.");
    }

    const meResponse = await input.fetch(`${input.webOrigin}/api/me`, {
      headers: { cookie: cookieHeader },
    });
    const meBody = await readJson(meResponse);
    if (
      meResponse.status !== 200 ||
      !isRecord(meBody) ||
      !isRecord(meBody.user) ||
      meBody.user.username !== username
    ) {
      throw new Error(
        `/api/me failed: ${meResponse.status} ${JSON.stringify(meBody)}`,
      );
    }

    return {
      username,
      loginStatus: loginResponse.status,
      meStatus: meResponse.status,
    };
  } finally {
    await input.queryD1(
      "DELETE FROM login_attempts WHERE username_or_email_normalized = ?",
      [normalizedUsername],
    );
    await input.queryD1("DELETE FROM refresh_sessions WHERE user_id = ?", [
      userId,
    ]);
    await input.queryD1("DELETE FROM users WHERE id = ?", [userId]);
  }
}

export async function hashPasswordForLiveCheck(input: {
  password: string;
  pepper: string;
  cost?: number;
}): Promise<string> {
  const digest = await webcrypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${input.pepper}\u0000${input.password}`),
  );
  return bcrypt.hash(
    Buffer.from(digest).toString("base64url"),
    input.cost ?? 10,
  );
}

export function createCloudflareD1Query(input: {
  accountId: string;
  databaseId: string;
  apiToken: string;
  fetch?: typeof fetch;
}): LiveWebAuthCheckInput["queryD1"] {
  return async (sql, params = []) => {
    const fetchD1 = input.fetch ?? fetch;
    const response = await fetchD1(
      `https://api.cloudflare.com/client/v4/accounts/${input.accountId}/d1/database/${input.databaseId}/query`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${input.apiToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ sql, params }),
      },
    );
    const body = (await response.json()) as CloudflareD1QueryResponse;
    const result = body.result?.[0];
    if (!response.ok || !body.success || result?.success === false) {
      const message =
        body.errors?.map((error) => error.message).join("; ") ||
        `Cloudflare D1 query failed with HTTP ${response.status}.`;
      throw new Error(message);
    }

    return result?.results ?? [];
  };
}

async function runCli() {
  const config = readLiveWebAuthConfig();
  const result = await runLiveWebAuthCheck({
    webOrigin: config.webOrigin,
    now: () => new Date(),
    suffix: () => Date.now().toString(36),
    hashPassword: (password) =>
      hashPasswordForLiveCheck({
        password,
        pepper: config.passwordPepper,
      }),
    queryD1: createCloudflareD1Query(config),
    fetch,
  });

  console.log(JSON.stringify(result, null, 2));
}

function readLiveWebAuthConfig() {
  const database = Resource.Database as unknown as {
    databaseId?: string;
  };
  const web = Resource.Web as unknown as {
    url?: string;
  };
  const accountId =
    process.env.CLOUDFLARE_ACCOUNT_ID ??
    process.env.CLOUDFLARE_DEFAULT_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const passwordPepper = Resource.PasswordPepper.value;

  if (!web.url) {
    throw new Error("Missing Resource.Web.url.");
  }
  if (!database.databaseId) {
    throw new Error("Missing Resource.Database.databaseId.");
  }
  if (!accountId) {
    throw new Error("Missing CLOUDFLARE_ACCOUNT_ID.");
  }
  if (!apiToken) {
    throw new Error("Missing CLOUDFLARE_API_TOKEN.");
  }

  return {
    webOrigin: web.url,
    accountId,
    databaseId: database.databaseId,
    apiToken,
    passwordPepper,
  };
}

function cookieHeaderForRequest(headers: Headers): string {
  const getSetCookie = (headers as Headers & { getSetCookie?: () => string[] })
    .getSetCookie;
  const cookies = getSetCookie ? getSetCookie.call(headers) : [];

  return cookies.map((cookie) => cookie.split(";")[0]).join("; ");
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type CloudflareD1QueryResponse = {
  success: boolean;
  errors?: Array<{ message: string }>;
  result?: Array<{
    success?: boolean;
    results?: unknown[];
  }>;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void runCli();
}
