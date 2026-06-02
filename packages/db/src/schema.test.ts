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
