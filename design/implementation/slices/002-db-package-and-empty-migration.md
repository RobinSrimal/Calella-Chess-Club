# DB Package And Empty Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the `packages/db` workspace and the first committed D1 migration scaffold without adding application tables yet.

**Architecture:** `packages/db` owns migration metadata and migration files. This slice adds a small typed migration manifest, a comment-only SQL migration, and tests that prove the migration exists while intentionally containing no schema statements. It does not apply migrations to Cloudflare D1 and does not create any app tables.

**Tech Stack:** npm workspaces, TypeScript, Vitest, Cloudflare D1 SQL migration files.

---

## File Structure

```txt
packages/db/package.json
  Defines the @CCC/db workspace, scripts, and package-local dev dependencies.

packages/db/tsconfig.json
  Matches the existing workspace TypeScript settings.

packages/db/src/schema.ts
  Exports a typed migration manifest used by DB tooling and tests.

packages/db/src/schema.test.ts
  Verifies the migration manifest and proves the scaffold migration contains no schema statements.

packages/db/migrations/0001_empty.sql
  Comment-only D1 migration scaffold. No CREATE, ALTER, DROP, or INSERT statements.

package-lock.json
  Updated by npm after adding the workspace package.

design/packages/db/migrations.md
  Clarifies that `0001_empty.sql` is a scaffold migration and that the full app schema starts in a later schema migration.

design/implementation/log.md
  Updated after the slice is completed.
```

## Out Of Scope

```txt
creating users/posts/events/auth tables
creating indexes
applying migrations to Cloudflare D1
adding wrangler configuration
binding D1 to Workers
```

### Task 1: Add DB Workspace And Red Manifest Test

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/src/schema.test.ts`

- [ ] **Step 1: Create the DB workspace package**

Create `packages/db/package.json`:

```json
{
  "name": "@CCC/db",
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "test": "vitest --run",
    "typecheck": "tsc --noEmit"
  },
  "exports": {
    "./schema": "./src/schema.ts"
  },
  "devDependencies": {
    "@types/node": "^22",
    "vitest": "^2"
  }
}
```

- [ ] **Step 2: Create the DB TypeScript config**

Create `packages/db/tsconfig.json`:

```json
{
  "extends": "@tsconfig/node22/tsconfig.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler"
  }
}
```

- [ ] **Step 3: Write the failing migration manifest test**

Create `packages/db/src/schema.test.ts`:

```ts
import { expect, test } from "vitest";
import { migrations } from "./schema";

test("declares the initial scaffold migration", () => {
  expect(migrations).toEqual([
    {
      id: "0001_empty",
      path: "migrations/0001_empty.sql",
      description: "Scaffold migration with no schema changes.",
    },
  ]);
});
```

- [ ] **Step 4: Run the test to verify it fails for the expected reason**

Run:

```bash
npm test --workspace packages/db
```

Expected result:

```txt
FAIL packages/db/src/schema.test.ts
Cannot find module './schema'
```

The exact Vitest wording can differ, but the failure must be caused by the missing `packages/db/src/schema.ts` module.

### Task 2: Add Migration Manifest Implementation

**Files:**
- Create: `packages/db/src/schema.ts`
- Modify: `package-lock.json`

- [ ] **Step 1: Create the migration manifest**

Create `packages/db/src/schema.ts`:

```ts
export const migrations = [
  {
    id: "0001_empty",
    path: "migrations/0001_empty.sql",
    description: "Scaffold migration with no schema changes.",
  },
] as const;

export type Migration = (typeof migrations)[number];
export type MigrationId = Migration["id"];
```

- [ ] **Step 2: Run the manifest test**

Run:

```bash
npm test --workspace packages/db
```

Expected result:

```txt
1 test passed
```

- [ ] **Step 3: Run the DB package typecheck**

Run:

```bash
npm run typecheck --workspace packages/db
```

Expected result: exit code `0`.

- [ ] **Step 4: Update the root package lock**

Run:

```bash
npm install --package-lock-only
```

Expected result: `package-lock.json` includes the new `packages/db` workspace metadata and does not add runtime dependencies.

- [ ] **Step 5: Commit the DB package scaffold**

Run:

```bash
git add packages/db/package.json packages/db/tsconfig.json packages/db/src/schema.test.ts packages/db/src/schema.ts package-lock.json
git commit -m "Add db package scaffold"
```

Expected result: commit succeeds and includes only the files listed above.

### Task 3: Add Empty Migration With Red-Green Coverage

**Files:**
- Modify: `packages/db/src/schema.test.ts`
- Create: `packages/db/migrations/0001_empty.sql`

- [ ] **Step 1: Extend the test to read the migration file**

Replace `packages/db/src/schema.test.ts` with:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails for the expected reason**

Run:

```bash
npm test --workspace packages/db
```

Expected result:

```txt
FAIL packages/db/src/schema.test.ts
ENOENT: no such file or directory
```

The exact path can differ, but the failure must be caused by missing `packages/db/migrations/0001_empty.sql`.

- [ ] **Step 3: Create the empty migration file**

Create `packages/db/migrations/0001_empty.sql`:

```sql
-- 0001_empty.sql
-- Scaffold migration for the Calella Chess Club D1 database.
-- This migration intentionally creates no schema.
-- Application tables and indexes are created in a subsequent schema migration.
```

- [ ] **Step 4: Run the DB package tests**

Run:

```bash
npm test --workspace packages/db
```

Expected result:

```txt
2 tests passed
```

- [ ] **Step 5: Run the DB package typecheck**

Run:

```bash
npm run typecheck --workspace packages/db
```

Expected result: exit code `0`.

- [ ] **Step 6: Verify the migration has no schema statements**

Run:

```bash
grep -E "\\b(CREATE|ALTER|DROP|INSERT)\\b" -n packages/db/migrations/0001_empty.sql
```

Expected result: no output and exit code `1`.

- [ ] **Step 7: Commit the empty migration**

Run:

```bash
git add packages/db/src/schema.test.ts packages/db/migrations/0001_empty.sql
git commit -m "Add initial D1 migration scaffold"
```

Expected result: commit succeeds and includes only the files listed above.

### Task 4: Align Migration Design Documentation

**Files:**
- Modify: `design/packages/db/migrations.md`

- [ ] **Step 1: Update the migration design doc**

Replace `design/packages/db/migrations.md` with:

~~~md
# D1 Migrations

## Purpose

Migrations define the D1 schema. They are committed and run explicitly; request handlers do not create or mutate schema.

## Intended Location

```txt
packages/db/migrations/
```

## Migration Sequence

```txt
0001_empty.sql
  Scaffold migration committed with the DB package. It contains no schema statements.

Future schema migration
  Creates users, email_verification_tokens, password_reset_tokens, refresh_sessions, login_attempts, posts, events, and audit_events.
```

## First Schema Migration Scope

The first schema migration creates:

```txt
users
email_verification_tokens
password_reset_tokens
refresh_sessions
login_attempts
posts
events
audit_events
```

Indexes should support login lookup, token lookup, active sessions, member content lists, public landing feeds, and admin membership queues.
~~~

- [ ] **Step 2: Verify the design doc describes the scaffold migration**

Run:

```bash
grep -n "0001_empty.sql\\|Scaffold migration committed with the DB package\\|First Schema Migration Scope" design/packages/db/migrations.md
```

Expected result: three matching lines.

- [ ] **Step 3: Commit the migration design doc update**

Run:

```bash
git add design/packages/db/migrations.md
git commit -m "Clarify D1 migration sequence"
```

Expected result: commit succeeds and changes only `design/packages/db/migrations.md`.

### Task 5: Final Verification And Implementation Log

**Files:**
- Modify: `design/implementation/log.md`

- [ ] **Step 1: Run final DB package verification**

Run:

```bash
npm test --workspace packages/db
npm run typecheck --workspace packages/db
grep -E "\\b(CREATE|ALTER|DROP|INSERT)\\b" -n packages/db/migrations/0001_empty.sql
```

Expected result:

```txt
npm test exits 0 with 2 tests passing
npm run typecheck exits 0
grep prints no output and exits 1
```

- [ ] **Step 2: Verify existing package checks still pass**

Run:

```bash
npx tsc -p packages/core/tsconfig.json --noEmit
npx tsc -p packages/functions/tsconfig.json --noEmit
npx tsc -p packages/scripts/tsconfig.json --noEmit
npx sst shell --stage dev -- vitest --run
```

Expected result:

```txt
all TypeScript commands exit 0
core Vitest exits 0 with 1 test passing
```

- [ ] **Step 3: Capture implementation commit hashes**

Run:

```bash
git log --oneline -3
```

Expected result: the three most recent commits are:

```txt
Clarify D1 migration sequence
Add initial D1 migration scaffold
Add db package scaffold
```

- [ ] **Step 4: Update the implementation log**

Append a `Completed Slice: 002-db-package-and-empty-migration` section to `design/implementation/log.md`.

The section must include:

```txt
slice name
commit hashes from Step 3
files changed
verification commands from Steps 1 and 2
verification results from Steps 1 and 2
remaining note: the D1 schema tables are still not created; that is intentionally deferred to the first schema migration slice.
```

- [ ] **Step 5: Commit the implementation log update**

Run:

```bash
git add design/implementation/log.md
git commit -m "Record db package slice"
```

Expected result: commit succeeds and changes only `design/implementation/log.md`.
