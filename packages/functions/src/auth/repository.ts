import type { D1Database } from "@cloudflare/workers-types";

export type PublicUser = {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  membershipStatus: "none" | "pending" | "member" | "rejected";
  role: "user" | "admin";
};

export type AccountStatus = "active" | "disabled";
export type MembershipStatus = PublicUser["membershipStatus"];
export type UserRole = PublicUser["role"];

export type UserLookup = {
  id: string;
};

export type LoginUserLookup = PublicUser & {
  passwordHash: string;
  passwordHashAlgorithm: string;
  accountStatus: AccountStatus;
  emailVerifiedAt: string | null;
};

export type UserInsert = {
  id: string;
  username: string;
  usernameNormalized: string;
  email: string;
  emailNormalized: string;
  passwordHash: string;
  passwordHashAlgorithm: string;
  accountStatus: "active" | "disabled";
  membershipStatus: "none" | "pending" | "member" | "rejected";
  role: "user" | "admin";
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  disabledAt: string | null;
  disabledBy: string | null;
};

export type VerificationTokenInsert = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
};

export type VerificationTokenLookup = {
  id: string;
  userId: string;
  expiresAt: string;
  usedAt: string | null;
};

export type CreateUserWithVerificationTokenInput = {
  user: UserInsert;
  token: VerificationTokenInsert;
};

export type MarkEmailVerifiedInput = {
  tokenId: string;
  userId: string;
  verifiedAt: string;
};

export type RefreshSessionInsert = {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  replacedBy: string | null;
  userAgent: string | null;
};

export type RefreshSessionLookup = {
  id: string;
  userId: string;
  expiresAt: string;
  revokedAt: string | null;
  replacedBy: string | null;
  user: PublicUser;
};

export type RotateRefreshSessionInput = {
  currentSessionId: string;
  revokedAt: string;
  replacement: RefreshSessionInsert;
};

export type RevokeRefreshSessionInput = {
  tokenHash: string;
  revokedAt: string;
};

export type LoginAttemptInsert = {
  id: string;
  usernameOrEmail: string;
  usernameOrEmailNormalized: string;
  success: boolean;
  failureCode: string | null;
  createdAt: string;
};

export type AuthRepository = {
  findUserByUsernameNormalized(usernameNormalized: string): Promise<UserLookup | null>;
  findUserByEmailNormalized(emailNormalized: string): Promise<UserLookup | null>;
  findUserForLogin(usernameOrEmailNormalized: string): Promise<LoginUserLookup | null>;
  findPublicUserById(userId: string): Promise<PublicUser | null>;
  createUserWithVerificationToken(input: CreateUserWithVerificationTokenInput): Promise<void>;
  deleteUnverifiedUser(userId: string): Promise<void>;
  findVerificationTokenByHash(tokenHash: string): Promise<VerificationTokenLookup | null>;
  markEmailVerified(input: MarkEmailVerifiedInput): Promise<void>;
  createRefreshSession(input: RefreshSessionInsert): Promise<void>;
  findRefreshSessionByTokenHash(tokenHash: string): Promise<RefreshSessionLookup | null>;
  rotateRefreshSession(input: RotateRefreshSessionInput): Promise<void>;
  revokeRefreshSessionByTokenHash(input: RevokeRefreshSessionInput): Promise<void>;
  recordLoginAttempt(input: LoginAttemptInsert): Promise<void>;
};

type UserRow = {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  passwordHashAlgorithm: string;
  accountStatus: AccountStatus;
  membershipStatus: MembershipStatus;
  role: UserRole;
  emailVerifiedAt: string | null;
};

type RefreshSessionRow = {
  id: string;
  userId: string;
  expiresAt: string;
  revokedAt: string | null;
  replacedBy: string | null;
  username: string;
  email: string;
  membershipStatus: MembershipStatus;
  role: UserRole;
  emailVerifiedAt: string | null;
};

export function createD1AuthRepository(database: D1Database): AuthRepository {
  return {
    async findUserByUsernameNormalized(usernameNormalized) {
      return database
        .prepare("SELECT id FROM users WHERE username_normalized = ?")
        .bind(usernameNormalized)
        .first<UserLookup>();
    },

    async findUserByEmailNormalized(emailNormalized) {
      return database
        .prepare("SELECT id FROM users WHERE email_normalized = ?")
        .bind(emailNormalized)
        .first<UserLookup>();
    },

    async findUserForLogin(usernameOrEmailNormalized) {
      const row = await database
        .prepare(
          [
            "SELECT",
            "id, username, email, password_hash as passwordHash,",
            "password_hash_algorithm as passwordHashAlgorithm,",
            "account_status as accountStatus, membership_status as membershipStatus,",
            "role, email_verified_at as emailVerifiedAt",
            "FROM users",
            "WHERE username_normalized = ? OR email_normalized = ?",
            "LIMIT 1",
          ].join(" "),
        )
        .bind(usernameOrEmailNormalized, usernameOrEmailNormalized)
        .first<UserRow>();

      return row ? mapLoginUser(row) : null;
    },

    async findPublicUserById(userId) {
      const row = await database
        .prepare(
          [
            "SELECT",
            "id, username, email, password_hash as passwordHash,",
            "password_hash_algorithm as passwordHashAlgorithm,",
            "account_status as accountStatus, membership_status as membershipStatus,",
            "role, email_verified_at as emailVerifiedAt",
            "FROM users",
            "WHERE id = ?",
          ].join(" "),
        )
        .bind(userId)
        .first<UserRow>();

      return row ? mapPublicUser(row) : null;
    },

    async createUserWithVerificationToken(input) {
      await database.batch([
        database
          .prepare(
            [
              "INSERT INTO users (",
              "id, username, username_normalized, email, email_normalized,",
              "password_hash, password_hash_algorithm, account_status, membership_status, role,",
              "email_verified_at, created_at, updated_at, disabled_at, disabled_by",
              ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            ].join(" "),
          )
          .bind(
            input.user.id,
            input.user.username,
            input.user.usernameNormalized,
            input.user.email,
            input.user.emailNormalized,
            input.user.passwordHash,
            input.user.passwordHashAlgorithm,
            input.user.accountStatus,
            input.user.membershipStatus,
            input.user.role,
            input.user.emailVerifiedAt,
            input.user.createdAt,
            input.user.updatedAt,
            input.user.disabledAt,
            input.user.disabledBy,
          ),
        database
          .prepare(
            [
              "INSERT INTO email_verification_tokens (",
              "id, user_id, token_hash, expires_at, used_at, created_at",
              ") VALUES (?, ?, ?, ?, ?, ?)",
            ].join(" "),
          )
          .bind(
            input.token.id,
            input.token.userId,
            input.token.tokenHash,
            input.token.expiresAt,
            input.token.usedAt,
            input.token.createdAt,
          ),
      ]);
    },

    async deleteUnverifiedUser(userId) {
      await database.batch([
        database
          .prepare("DELETE FROM email_verification_tokens WHERE user_id = ?")
          .bind(userId),
        database
          .prepare(
            [
              "DELETE FROM users",
              "WHERE id = ?",
              "AND email_verified_at IS NULL",
              "AND membership_status = 'none'",
            ].join(" "),
          )
          .bind(userId),
      ]);
    },

    async findVerificationTokenByHash(tokenHash) {
      return database
        .prepare(
          [
            "SELECT id, user_id as userId, expires_at as expiresAt, used_at as usedAt",
            "FROM email_verification_tokens",
            "WHERE token_hash = ?",
          ].join(" "),
        )
        .bind(tokenHash)
        .first<VerificationTokenLookup>();
    },

    async markEmailVerified(input) {
      await database.batch([
        database
          .prepare(
            "UPDATE email_verification_tokens SET used_at = ? WHERE id = ? AND used_at IS NULL",
          )
          .bind(input.verifiedAt, input.tokenId),
        database
          .prepare(
            [
              "UPDATE users",
              "SET email_verified_at = ?, membership_status = 'pending', updated_at = ?",
              "WHERE id = ? AND email_verified_at IS NULL",
            ].join(" "),
          )
          .bind(input.verifiedAt, input.verifiedAt, input.userId),
      ]);
    },

    async createRefreshSession(input) {
      await database
        .prepare(
          [
            "INSERT INTO refresh_sessions (",
            "id, user_id, token_hash, created_at, expires_at, revoked_at, replaced_by, user_agent",
            ") VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          ].join(" "),
        )
        .bind(
          input.id,
          input.userId,
          input.tokenHash,
          input.createdAt,
          input.expiresAt,
          input.revokedAt,
          input.replacedBy,
          input.userAgent,
        )
        .run();
    },

    async findRefreshSessionByTokenHash(tokenHash) {
      const row = await database
        .prepare(
          [
            "SELECT",
            "refresh_sessions.id, refresh_sessions.user_id as userId,",
            "refresh_sessions.expires_at as expiresAt,",
            "refresh_sessions.revoked_at as revokedAt,",
            "refresh_sessions.replaced_by as replacedBy,",
            "users.username, users.email, users.membership_status as membershipStatus,",
            "users.role, users.email_verified_at as emailVerifiedAt",
            "FROM refresh_sessions",
            "JOIN users ON users.id = refresh_sessions.user_id",
            "WHERE refresh_sessions.token_hash = ?",
          ].join(" "),
        )
        .bind(tokenHash)
        .first<RefreshSessionRow>();

      return row ? mapRefreshSession(row) : null;
    },

    async rotateRefreshSession(input) {
      await database.batch([
        database
          .prepare(
            [
              "UPDATE refresh_sessions",
              "SET revoked_at = ?, replaced_by = ?",
              "WHERE id = ? AND revoked_at IS NULL",
            ].join(" "),
          )
          .bind(
            input.revokedAt,
            input.replacement.id,
            input.currentSessionId,
          ),
        database
          .prepare(
            [
              "INSERT INTO refresh_sessions (",
              "id, user_id, token_hash, created_at, expires_at, revoked_at, replaced_by, user_agent",
              ") VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            ].join(" "),
          )
          .bind(
            input.replacement.id,
            input.replacement.userId,
            input.replacement.tokenHash,
            input.replacement.createdAt,
            input.replacement.expiresAt,
            input.replacement.revokedAt,
            input.replacement.replacedBy,
            input.replacement.userAgent,
          ),
      ]);
    },

    async revokeRefreshSessionByTokenHash(input) {
      await database
        .prepare(
          [
            "UPDATE refresh_sessions",
            "SET revoked_at = ?",
            "WHERE token_hash = ? AND revoked_at IS NULL",
          ].join(" "),
        )
        .bind(input.revokedAt, input.tokenHash)
        .run();
    },

    async recordLoginAttempt(input) {
      await database
        .prepare(
          [
            "INSERT INTO login_attempts (",
            "id, username_or_email, username_or_email_normalized, success, failure_code, created_at",
            ") VALUES (?, ?, ?, ?, ?, ?)",
          ].join(" "),
        )
        .bind(
          input.id,
          input.usernameOrEmail,
          input.usernameOrEmailNormalized,
          input.success ? 1 : 0,
          input.failureCode,
          input.createdAt,
        )
        .run();
    },
  };
}

function mapLoginUser(row: UserRow): LoginUserLookup {
  return {
    ...mapPublicUser(row),
    passwordHash: row.passwordHash,
    passwordHashAlgorithm: row.passwordHashAlgorithm,
    accountStatus: row.accountStatus,
    emailVerifiedAt: row.emailVerifiedAt,
  };
}

function mapPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    emailVerified: row.emailVerifiedAt !== null,
    membershipStatus: row.membershipStatus,
    role: row.role,
  };
}

function mapRefreshSession(row: RefreshSessionRow): RefreshSessionLookup {
  return {
    id: row.id,
    userId: row.userId,
    expiresAt: row.expiresAt,
    revokedAt: row.revokedAt,
    replacedBy: row.replacedBy,
    user: {
      id: row.userId,
      username: row.username,
      email: row.email,
      emailVerified: row.emailVerifiedAt !== null,
      membershipStatus: row.membershipStatus,
      role: row.role,
    },
  };
}
