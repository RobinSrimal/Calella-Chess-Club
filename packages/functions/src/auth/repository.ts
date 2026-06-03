import type { D1Database } from "@cloudflare/workers-types";

export type PublicUser = {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  membershipStatus: "none" | "pending" | "member" | "rejected";
  role: "user" | "admin";
};

export type UserLookup = {
  id: string;
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

export type AuthRepository = {
  findUserByUsernameNormalized(usernameNormalized: string): Promise<UserLookup | null>;
  findUserByEmailNormalized(emailNormalized: string): Promise<UserLookup | null>;
  createUserWithVerificationToken(input: CreateUserWithVerificationTokenInput): Promise<void>;
  deleteUnverifiedUser(userId: string): Promise<void>;
  findVerificationTokenByHash(tokenHash: string): Promise<VerificationTokenLookup | null>;
  markEmailVerified(input: MarkEmailVerifiedInput): Promise<void>;
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
  };
}
