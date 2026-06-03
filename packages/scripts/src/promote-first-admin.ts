import { fileURLToPath } from "node:url";
import { Resource } from "sst";

export type ScriptErrorCode =
  | "SCRIPT_USER_NOT_FOUND"
  | "SCRIPT_USER_NOT_VERIFIED"
  | "SCRIPT_USER_DISABLED";

export type FirstAdminPromotionUser = {
  id: string;
  username: string;
  email: string;
  accountStatus: "active" | "disabled";
  emailVerifiedAt: string | null;
  role: "user" | "admin";
};

export type PromotedAdminUser = {
  id: string;
  username: string;
  email: string;
  role: "admin";
};

export type FirstAdminPromotionRepository = {
  findUserForFirstAdminPromotion(
    usernameOrEmailNormalized: string,
  ): Promise<FirstAdminPromotionUser | null>;
  promoteUserToAdmin(input: {
    userId: string;
    updatedAt: string;
  }): Promise<PromotedAdminUser>;
};

export async function promoteFirstAdmin(input: {
  usernameOrEmail: string;
  repository: FirstAdminPromotionRepository;
  now: () => Date;
}): Promise<
  | {
      ok: true;
      user: PromotedAdminUser;
    }
  | {
      ok: false;
      code: ScriptErrorCode;
    }
> {
  const usernameOrEmailNormalized = normalizeIdentifier(input.usernameOrEmail);
  const user = await input.repository.findUserForFirstAdminPromotion(
    usernameOrEmailNormalized,
  );

  if (!user) {
    return {
      ok: false,
      code: "SCRIPT_USER_NOT_FOUND",
    };
  }
  if (user.accountStatus === "disabled") {
    return {
      ok: false,
      code: "SCRIPT_USER_DISABLED",
    };
  }
  if (!user.emailVerifiedAt) {
    return {
      ok: false,
      code: "SCRIPT_USER_NOT_VERIFIED",
    };
  }

  return {
    ok: true,
    user: await input.repository.promoteUserToAdmin({
      userId: user.id,
      updatedAt: input.now().toISOString(),
    }),
  };
}

export type CloudflareD1ApiConfig = {
  accountId: string;
  databaseId: string;
  apiToken: string;
  fetch?: typeof fetch;
};

export function createCloudflareD1FirstAdminPromotionRepository(
  config: CloudflareD1ApiConfig,
): FirstAdminPromotionRepository {
  return {
    async findUserForFirstAdminPromotion(usernameOrEmailNormalized) {
      const rows = await queryD1<FirstAdminPromotionUser>(
        config,
        [
          "SELECT",
          "id, username, email, account_status as accountStatus,",
          "email_verified_at as emailVerifiedAt, role",
          "FROM users",
          "WHERE username_normalized = ? OR email_normalized = ?",
          "LIMIT 2",
        ].join(" "),
        [usernameOrEmailNormalized, usernameOrEmailNormalized],
      );

      if (rows.length !== 1) {
        return null;
      }

      return rows[0];
    },

    async promoteUserToAdmin(input) {
      await queryD1(
        config,
        [
          "UPDATE users",
          "SET role = 'admin', updated_at = ?",
          "WHERE id = ?",
        ].join(" "),
        [input.updatedAt, input.userId],
      );

      const promoted = await queryD1<PromotedAdminUser>(
        config,
        [
          "SELECT id, username, email, role",
          "FROM users",
          "WHERE id = ? AND role = 'admin'",
        ].join(" "),
        [input.userId],
      );

      if (!promoted[0]) {
        throw new Error("Failed to read promoted admin user.");
      }

      return promoted[0];
    },
  };
}

async function queryD1<T>(
  config: CloudflareD1ApiConfig,
  sql: string,
  params: string[] = [],
): Promise<T[]> {
  const fetchD1 = config.fetch ?? fetch;
  const response = await fetchD1(
    `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/d1/database/${config.databaseId}/query`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.apiToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sql,
        params,
      }),
    },
  );
  const body = (await response.json()) as CloudflareD1QueryResponse<T>;
  const result = body.result?.[0];

  if (!response.ok || !body.success || result?.success === false) {
    const message =
      body.errors?.map((error) => error.message).join("; ") ||
      `Cloudflare D1 query failed with HTTP ${response.status}.`;
    throw new Error(message);
  }

  return result?.results ?? [];
}

type CloudflareD1QueryResponse<T> = {
  success: boolean;
  errors?: Array<{
    message: string;
  }>;
  result?: Array<{
    success?: boolean;
    results?: T[];
  }>;
};

function normalizeIdentifier(value: string): string {
  return value.trim().toLowerCase();
}

function readUsernameOrEmail(args: string[]): string | undefined {
  const namedIndex = args.findIndex(
    (arg) => arg === "--username-or-email" || arg === "--identifier",
  );
  if (namedIndex !== -1) {
    return args[namedIndex + 1];
  }

  return args[0];
}

async function runCli() {
  const usernameOrEmail = readUsernameOrEmail(process.argv.slice(2));
  if (!usernameOrEmail) {
    console.error("Usage: promote-first-admin <username-or-email>");
    process.exitCode = 1;
    return;
  }

  const result = await promoteFirstAdmin({
    usernameOrEmail,
    repository: createCloudflareD1FirstAdminPromotionRepository(
      readCloudflareD1ApiConfig(),
    ),
    now: () => new Date(),
  });

  if (!result.ok) {
    console.error(result.code);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Promoted ${result.user.username} (${result.user.id}) to admin.`,
  );
}

function readCloudflareD1ApiConfig(): CloudflareD1ApiConfig {
  const database = Resource.Database as unknown as {
    databaseId?: string;
  };
  const accountId =
    process.env.CLOUDFLARE_ACCOUNT_ID ??
    process.env.CLOUDFLARE_DEFAULT_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

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
    accountId,
    databaseId: database.databaseId,
    apiToken,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void runCli();
}
