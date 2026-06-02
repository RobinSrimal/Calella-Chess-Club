# Cloudflare D1 Resource Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the active AWS scaffold resources with exactly one Cloudflare D1 resource managed by SST.

**Architecture:** This slice does not build app behavior. It changes only SST infrastructure wiring: `infra/db.ts` creates a D1 database, `sst.config.ts` uses Cloudflare as the home provider, and the old AWS bucket/function scaffold is removed from active infrastructure.

**Tech Stack:** SST 3.19.3, Cloudflare provider 6.17.0, Cloudflare D1, TypeScript.

---

## File Structure

```txt
infra/db.ts
  Creates the D1 resource.

sst.config.ts
  Uses Cloudflare as SST home provider and imports only the D1 resource.

infra/storage.ts
  Deleted because the AWS S3 scaffold is no longer active.

infra/api.ts
  Deleted because the AWS Lambda scaffold is no longer active.

design/implementation/log.md
  Updated after the slice is completed.
```

### Task 1: Replace Active SST Resources With One D1 Resource

**Files:**
- Create: `infra/db.ts`
- Modify: `sst.config.ts`
- Delete: `infra/storage.ts`
- Delete: `infra/api.ts`

- [ ] **Step 1: Create the D1 infra module**

Create `infra/db.ts`:

```ts
export const database = new sst.cloudflare.D1("Database");
```

- [ ] **Step 2: Update SST config to use Cloudflare home and D1 only**

Replace `sst.config.ts` with:

```ts
/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: "CCC",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "cloudflare",
      providers: { cloudflare: "6.17.0" },
    };
  },
  async run() {
    const db = await import("./infra/db");
    return {
      DatabaseId: db.database.databaseId,
    };
  },
});
```

- [ ] **Step 3: Delete inactive AWS scaffold infra files**

Delete:

```txt
infra/storage.ts
infra/api.ts
```

Do not edit `packages/functions` or `packages/scripts` in this slice. Those scaffold packages are replaced in later Worker/script slices.

- [ ] **Step 4: Verify active infra no longer references AWS scaffold resources**

Run:

```bash
grep -R "sst.aws\\|infra/storage\\|infra/api\\|MyBucket\\|MyApi" -n sst.config.ts infra
```

Expected: no output and exit code `1`.

- [ ] **Step 5: Verify SST can calculate the Cloudflare infrastructure diff**

Run:

```bash
npx sst diff --stage dev
```

Expected: exit code `0`; planned changes include one Cloudflare D1 database named `Database`; planned changes do not include an AWS S3 bucket or AWS Lambda function.

- [ ] **Step 6: Commit the infrastructure slice**

Run:

```bash
git add sst.config.ts infra/db.ts infra/storage.ts infra/api.ts
git commit -m "Add Cloudflare D1 resource"
```

Expected: commit succeeds and includes only `sst.config.ts`, `infra/db.ts`, and deletions for `infra/storage.ts` and `infra/api.ts`.

### Task 2: Record Slice Completion

**Files:**
- Modify: `design/implementation/log.md`

- [ ] **Step 1: Capture the implementation commit**

Run:

```bash
git rev-parse --short HEAD
```

Expected: prints the commit hash for `Add Cloudflare D1 resource`.

- [ ] **Step 2: Update the implementation log**

Append a section to `design/implementation/log.md` using the commit hash from the previous step and the verification result from `npx sst diff --stage dev`.

The section must include:

```txt
slice name
commit hash
files changed
verification command
verification result
open follow-up
```

The open follow-up is:

```txt
packages/functions and packages/scripts still contain AWS scaffold example code and are replaced in later Worker/script slices.
```

- [ ] **Step 3: Commit the log update**

Run:

```bash
git add design/implementation/log.md
git commit -m "Record Cloudflare D1 slice"
```

Expected: commit succeeds and changes only `design/implementation/log.md`.
