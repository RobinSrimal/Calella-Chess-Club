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
    {
      id: "0004_posts",
      path: "migrations/0004_posts.sql",
      description: "Create member posts.",
    },
    {
      id: "0005_events",
      path: "migrations/0005_events.sql",
      description: "Create member events.",
    },
    {
      id: "0006_posts_body_json",
      path: "migrations/0006_posts_body_json.sql",
      description: "Migrate posts from Markdown text to JSON documents.",
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

test("creates posts table and lookup indexes", () => {
  const migration = migrations[3];
  const sql = readFileSync(resolve(packageRoot, migration.path), "utf8");

  expect(sql).toMatch(/CREATE TABLE posts/i);
  expect(sql).toMatch(/author_id TEXT NOT NULL/i);
  expect(sql).toMatch(/body_markdown TEXT NOT NULL/i);
  expect(sql).toMatch(/status TEXT NOT NULL DEFAULT 'draft'/i);
  expect(sql).toMatch(/CHECK \(status IN \('draft', 'published', 'deleted'\)\)/i);
  expect(sql).toMatch(/is_public INTEGER NOT NULL DEFAULT 0/i);
  expect(sql).toMatch(/CHECK \(is_public IN \(0, 1\)\)/i);
  expect(sql).toMatch(/FOREIGN KEY \(author_id\) REFERENCES users\(id\)/i);
  expect(sql).toMatch(/FOREIGN KEY \(deleted_by\) REFERENCES users\(id\)/i);
  expect(sql).toMatch(/idx_posts_author_status/i);
  expect(sql).toMatch(/idx_posts_published/i);
  expect(sql).toMatch(/idx_posts_public/i);
});

test("creates events table and lookup indexes", () => {
  const migration = migrations[4];
  const sql = readFileSync(resolve(packageRoot, migration.path), "utf8");

  expect(sql).toMatch(/CREATE TABLE events/i);
  expect(sql).toMatch(/author_id TEXT NOT NULL/i);
  expect(sql).toMatch(/description_markdown TEXT NOT NULL/i);
  expect(sql).toMatch(/location TEXT/i);
  expect(sql).toMatch(/starts_at TEXT NOT NULL/i);
  expect(sql).toMatch(/ends_at TEXT NOT NULL/i);
  expect(sql).toMatch(/status TEXT NOT NULL DEFAULT 'draft'/i);
  expect(sql).toMatch(/CHECK \(status IN \('draft', 'published', 'deleted'\)\)/i);
  expect(sql).toMatch(/is_public INTEGER NOT NULL DEFAULT 0/i);
  expect(sql).toMatch(/CHECK \(is_public IN \(0, 1\)\)/i);
  expect(sql).toMatch(/FOREIGN KEY \(author_id\) REFERENCES users\(id\)/i);
  expect(sql).toMatch(/FOREIGN KEY \(deleted_by\) REFERENCES users\(id\)/i);
  expect(sql).toMatch(/idx_events_author_status/i);
  expect(sql).toMatch(/idx_events_published_starts_at/i);
  expect(sql).toMatch(/idx_events_public_starts_at/i);
});

test("migrates posts to JSON body storage", () => {
  const migration = migrations[5];
  const sql = readFileSync(resolve(packageRoot, migration.path), "utf8");

  expect(sql).toMatch(/CREATE TABLE posts_new/i);
  expect(sql).toMatch(/body_json TEXT NOT NULL/i);
  expect(sql).not.toMatch(/body_markdown/i);
  expect(sql).toMatch(/DROP TABLE posts/i);
  expect(sql).toMatch(/ALTER TABLE posts_new RENAME TO posts/i);
  expect(sql).toMatch(/idx_posts_author_status/i);
  expect(sql).toMatch(/idx_posts_published/i);
  expect(sql).toMatch(/idx_posts_public/i);
});
