import { fileURLToPath } from "node:url";
import type { D1Database } from "@cloudflare/workers-types";
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

export function createD1FirstAdminPromotionRepository(
  database: D1Database,
): FirstAdminPromotionRepository {
  return {
    async findUserForFirstAdminPromotion(usernameOrEmailNormalized) {
      const result = await database
        .prepare(
          [
            "SELECT",
            "id, username, email, account_status as accountStatus,",
            "email_verified_at as emailVerifiedAt, role",
            "FROM users",
            "WHERE username_normalized = ? OR email_normalized = ?",
            "LIMIT 2",
          ].join(" "),
        )
        .bind(usernameOrEmailNormalized, usernameOrEmailNormalized)
        .all<FirstAdminPromotionUser>();
      const rows = result.results ?? [];

      if (rows.length !== 1) {
        return null;
      }

      return rows[0];
    },

    async promoteUserToAdmin(input) {
      await database
        .prepare(
          [
            "UPDATE users",
            "SET role = 'admin', updated_at = ?",
            "WHERE id = ?",
          ].join(" "),
        )
        .bind(input.updatedAt, input.userId)
        .run();

      const promoted = await database
        .prepare(
          [
            "SELECT id, username, email, role",
            "FROM users",
            "WHERE id = ? AND role = 'admin'",
          ].join(" "),
        )
        .bind(input.userId)
        .first<PromotedAdminUser>();

      if (!promoted) {
        throw new Error("Failed to read promoted admin user.");
      }

      return promoted;
    },
  };
}

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
    repository: createD1FirstAdminPromotionRepository(Resource.Database),
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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void runCli();
}
