import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import { migrations } from "./schema";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("declares the initial scaffold migration", () => {
  expect(migrations).toEqual([
    {
      id: "0001_empty",
      path: "migrations/0001_empty.sql",
      description: "Scaffold migration with no schema changes.",
    },
    {
      id: "0002_auth_registration",
      path: "migrations/0002_auth_registration.sql",
      description: "Create users and email verification tokens.",
    },
    {
      id: "0003_auth_sessions",
      path: "migrations/0003_auth_sessions.sql",
      description: "Create refresh sessions and login attempt records.",
    },
  ]);
});

test("keeps the scaffold migration free of schema statements", () => {
  const migration = migrations[0];
  const sql = readFileSync(resolve(packageRoot, migration.path), "utf8");

  expect(sql).toContain("This migration intentionally creates no schema.");
  expect(sql).not.toMatch(/\bCREATE\b/i);
  expect(sql).not.toMatch(/\bALTER\b/i);
  expect(sql).not.toMatch(/\bDROP\b/i);
  expect(sql).not.toMatch(/\bINSERT\b/i);
});

test("creates auth registration tables and lookup indexes", () => {
  const migration = migrations[1];
  const sql = readFileSync(resolve(packageRoot, migration.path), "utf8");

  expect(sql).toMatch(/CREATE TABLE users/i);
  expect(sql).toMatch(/CREATE TABLE email_verification_tokens/i);
  expect(sql).toMatch(/username_normalized TEXT NOT NULL UNIQUE/i);
  expect(sql).toMatch(/email_normalized TEXT NOT NULL UNIQUE/i);
  expect(sql).toMatch(/password_hash TEXT NOT NULL/i);
  expect(sql).toMatch(/membership_status TEXT NOT NULL/i);
  expect(sql).toMatch(/token_hash TEXT NOT NULL UNIQUE/i);
  expect(sql).toMatch(/idx_users_membership_status/i);
  expect(sql).toMatch(/idx_email_verification_tokens_user_id/i);
  expect(sql).toMatch(/idx_email_verification_tokens_expires_at/i);
});

test("creates auth session tables and lookup indexes", () => {
  const migration = migrations[2];
  const sql = readFileSync(resolve(packageRoot, migration.path), "utf8");

  expect(sql).toMatch(/CREATE TABLE refresh_sessions/i);
  expect(sql).toMatch(/CREATE TABLE login_attempts/i);
  expect(sql).toMatch(/token_hash TEXT NOT NULL UNIQUE/i);
  expect(sql).toMatch(/revoked_at TEXT/i);
  expect(sql).toMatch(/replaced_by TEXT/i);
  expect(sql).toMatch(/user_agent TEXT/i);
  expect(sql).toMatch(/username_or_email_normalized TEXT NOT NULL/i);
  expect(sql).toMatch(/success INTEGER NOT NULL/i);
  expect(sql).toMatch(/failure_code TEXT/i);
  expect(sql).toMatch(/idx_refresh_sessions_user_active/i);
  expect(sql).toMatch(/idx_refresh_sessions_token_hash/i);
  expect(sql).toMatch(/idx_login_attempts_normalized_created_at/i);
});
