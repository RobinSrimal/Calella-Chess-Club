# Auth Worker Health Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Auth Worker entry point with an unauthenticated health route and wire it into SST/Cloudflare without implementing registration, login, passwords, sessions, cookies, or email.

**Architecture:** `packages/functions/src/auth.ts` becomes the auth Worker entry point and exports a small request handler that serves `GET /auth/health`. `infra/workers.ts` creates the Cloudflare Worker resource, links it to the existing D1 database, enables a Worker URL for the dev-stage health check, and `sst.config.ts` exposes that URL as an output. This slice keeps auth behavior intentionally narrow: health plus a stable not-found error code.

**Tech Stack:** TypeScript, Vitest, Cloudflare Workers Fetch API, SST `sst.cloudflare.Worker`, Cloudflare D1 link.

---

## File Structure

```txt
packages/functions/package.json
  Adds package-local test and typecheck scripts plus Vitest as a dev dependency.

packages/functions/src/auth.ts
  Auth Worker entry point. Exports `handleAuthRequest()` and the default Worker fetch handler.

packages/functions/src/auth.test.ts
  Unit tests for the health route and stable not-found error response.

package-lock.json
  Updated after adding the functions package test dependency metadata.

infra/workers.ts
  Creates the Cloudflare AuthApi Worker and links it to the D1 Database resource.

sst.config.ts
  Imports the worker infra module and returns `AuthApiUrl`.

sst-env.d.ts
packages/*/sst-env.d.ts
  SST-generated resource type files if `sst diff` or `sst deploy` updates them.

design/packages/functions/auth-worker.md
  Documents that this slice adds only `GET /auth/health`.

design/packages/functions/routes/auth.md
  Adds `GET /auth/health` to the route list and documents the stable not-found code.

design/implementation/log.md
  Updated after the slice is completed.
```

## Out Of Scope

```txt
registration
login
logout
refresh
email verification
password reset
bcrypt
JWTs
cookies
Resend
D1 queries
membership state
rate limiting
custom domains
Astro integration
```

### Task 1: Add Functions Test Setup And Red Auth Health Tests

**Files:**
- Modify: `packages/functions/package.json`
- Create: `packages/functions/src/auth.test.ts`

- [ ] **Step 1: Add functions package scripts and Vitest dev dependency**

Replace `packages/functions/package.json` with:

```json
{
  "name": "@CCC/functions",
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "test": "vitest --run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@CCC/core": "*",
    "sst": "*"
  },
  "devDependencies": {
    "vitest": "^2"
  }
}
```

- [ ] **Step 2: Write the failing auth Worker tests**

Create `packages/functions/src/auth.test.ts`:

```ts
import { expect, test } from "vitest";
import { handleAuthRequest } from "./auth";

test("GET /auth/health returns auth service status", async () => {
  const response = await handleAuthRequest(
    new Request("https://calella-chess-club.test/auth/health"),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe(
    "application/json; charset=utf-8",
  );
  await expect(response.json()).resolves.toEqual({
    service: "auth",
    status: "ok",
  });
});

test("unsupported auth routes return a stable error code", async () => {
  const response = await handleAuthRequest(
    new Request("https://calella-chess-club.test/auth/login", {
      method: "POST",
    }),
  );

  expect(response.status).toBe(404);
  expect(response.headers.get("content-type")).toBe(
    "application/json; charset=utf-8",
  );
  await expect(response.json()).resolves.toEqual({
    error: {
      code: "AUTH_ROUTE_NOT_FOUND",
    },
  });
});
```

- [ ] **Step 3: Run the test to verify it fails for the expected reason**

Run:

```bash
npm test --workspace packages/functions
```

Expected result:

```txt
FAIL packages/functions/src/auth.test.ts
Failed to load url ./auth
```

The exact Vitest wording can differ, but the failure must be caused by missing `packages/functions/src/auth.ts`.

### Task 2: Implement Auth Worker Health Handler

**Files:**
- Create: `packages/functions/src/auth.ts`
- Modify: `package-lock.json`

- [ ] **Step 1: Create the auth Worker handler**

Create `packages/functions/src/auth.ts`:

```ts
export type AuthHealthResponse = {
  service: "auth";
  status: "ok";
};

export type AuthErrorCode = "AUTH_ROUTE_NOT_FOUND";

export type AuthErrorResponse = {
  error: {
    code: AuthErrorCode;
  };
};

type JsonBody = AuthHealthResponse | AuthErrorResponse;

export async function handleAuthRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/auth/health") {
    const body: AuthHealthResponse = {
      service: "auth",
      status: "ok",
    };
    return jsonResponse(body);
  }

  const body: AuthErrorResponse = {
    error: {
      code: "AUTH_ROUTE_NOT_FOUND",
    },
  };
  return jsonResponse(body, { status: 404 });
}

function jsonResponse(body: JsonBody, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

export default {
  fetch: handleAuthRequest,
};
```

- [ ] **Step 2: Run the functions tests**

Run:

```bash
npm test --workspace packages/functions
```

Expected result:

```txt
2 tests passed
```

- [ ] **Step 3: Run the functions package typecheck**

Run:

```bash
npm run typecheck --workspace packages/functions
```

Expected result: exit code `0`.

- [ ] **Step 4: Update the root package lock**

Run:

```bash
npm install --package-lock-only
```

Expected result: `package-lock.json` records the functions package `vitest` dev dependency and does not add new runtime dependencies.

- [ ] **Step 5: Commit the auth Worker handler**

Run:

```bash
git add packages/functions/package.json packages/functions/src/auth.test.ts packages/functions/src/auth.ts package-lock.json
git commit -m "Add auth Worker health handler"
```

Expected result: commit succeeds and includes only the files listed above.

### Task 3: Add Auth Worker Infrastructure

**Files:**
- Create: `infra/workers.ts`
- Modify: `sst.config.ts`
- Modify if generated: `sst-env.d.ts`
- Modify if generated: `packages/core/sst-env.d.ts`
- Modify if generated: `packages/db/sst-env.d.ts`
- Modify if generated: `packages/functions/sst-env.d.ts`
- Modify if generated: `packages/scripts/sst-env.d.ts`

- [ ] **Step 1: Create the worker infra module**

Create `infra/workers.ts`:

```ts
import { database } from "./db";

export const authApi = new sst.cloudflare.Worker("AuthApi", {
  handler: "packages/functions/src/auth.ts",
  link: [database],
  url: true,
});
```

- [ ] **Step 2: Import the Auth Worker from SST config**

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
    const workers = await import("./infra/workers");
    return {
      DatabaseId: db.database.databaseId,
      AuthApiUrl: workers.authApi.url,
    };
  },
});
```

- [ ] **Step 3: Verify active infra references AuthApi and no AWS resources**

Run:

```bash
grep -R "AuthApi\\|sst.aws\\|MyBucket\\|MyApi" -n sst.config.ts infra
```

Expected result:

```txt
sst.config.ts contains AuthApiUrl.
infra/workers.ts contains AuthApi.
No sst.aws, MyBucket, or MyApi matches are present.
```

- [ ] **Step 4: Verify SST can calculate the Cloudflare diff**

Run:

```bash
npx sst diff --stage dev --print-logs
```

Expected result:

```txt
exit code 0
planned changes include a Cloudflare Worker named AuthApi
planned changes do not replace or delete the existing Database D1 resource
```

- [ ] **Step 5: Review generated SST env file changes**

Run:

```bash
git status --short
```

Expected result: source changes include `sst.config.ts` and `infra/workers.ts`. If SST generated resource type updates, they appear as changes to `sst-env.d.ts` and/or `packages/*/sst-env.d.ts`.

- [ ] **Step 6: Commit the Auth Worker infrastructure**

Run:

```bash
git add sst.config.ts infra/workers.ts sst-env.d.ts packages/*/sst-env.d.ts
git commit -m "Add auth Worker infrastructure"
```

Expected result: commit succeeds and includes `sst.config.ts`, `infra/workers.ts`, and any SST-generated env type files changed by the diff command.

### Task 4: Align Auth Worker Design Documentation

**Files:**
- Modify: `design/packages/functions/auth-worker.md`
- Modify: `design/packages/functions/routes/auth.md`

- [ ] **Step 1: Update the auth Worker design doc**

Replace `design/packages/functions/auth-worker.md` with:

~~~md
# Auth Worker

## Intended Entry Point

```txt
packages/functions/src/auth.ts
```

## Purpose

Owns username/password authentication and session refresh.

## Current Implemented Scope

```txt
GET /auth/health
  Returns the Auth Worker health status.
```

## Future Responsibilities

```txt
register users
send email verification through Resend
verify email tokens
create pending membership after email verification
log users in
issue access JWT cookies
issue refresh cookies
refresh access JWTs
log users out
send password reset email
reset passwords
record failed login attempts
```

## Cookies

```txt
ccc_access_token:
  JWT
  2-hour lifetime
  HTTP-only
  Secure in production
  SameSite=Lax
  Path=/api

ccc_refresh_token:
  opaque token
  14-day lifetime
  HTTP-only
  Secure in production
  SameSite=Lax
  Path=/auth
```
~~~

- [ ] **Step 2: Update the auth routes design doc**

Replace `design/packages/functions/routes/auth.md` with:

~~~md
# Routes: /auth/*

## Worker

Auth Worker.

## Current Routes

```txt
GET /auth/health
```

## Future Routes

```txt
POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/refresh
GET  /auth/verify-email
POST /auth/forgot-password
POST /auth/reset-password
```

## Error Format

All auth routes return stable error codes.

```json
{
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS"
  }
}
```

## Current Error Codes

```txt
AUTH_ROUTE_NOT_FOUND
```
~~~

- [ ] **Step 3: Verify the design docs mention the health route and stable error code**

Run:

```bash
grep -R "GET /auth/health\\|AUTH_ROUTE_NOT_FOUND" -n design/packages/functions/auth-worker.md design/packages/functions/routes/auth.md
```

Expected result:

```txt
design/packages/functions/auth-worker.md contains GET /auth/health.
design/packages/functions/routes/auth.md contains GET /auth/health and AUTH_ROUTE_NOT_FOUND.
```

- [ ] **Step 4: Commit the auth design doc updates**

Run:

```bash
git add design/packages/functions/auth-worker.md design/packages/functions/routes/auth.md
git commit -m "Document auth Worker health route"
```

Expected result: commit succeeds and changes only the two design docs listed above.

### Task 5: Deploy And Verify Dev Auth Worker

**Files:**
- No source files should change. If `sst deploy` updates generated `sst-env.d.ts` files, commit those generated files with message `Update SST env for auth Worker`.

- [ ] **Step 1: Deploy the dev stage**

Run:

```bash
npx sst deploy --stage dev --print-logs
```

Expected result:

```txt
exit code 0
output includes DatabaseId
output includes AuthApiUrl
Cloudflare creates or updates the AuthApi Worker
```

- [ ] **Step 2: Run a post-deploy diff**

Run:

```bash
npx sst diff --stage dev --print-logs
```

Expected result:

```txt
exit code 0
no pending AuthApi or Database changes are reported
output includes the same DatabaseId and AuthApiUrl values from deploy
```

- [ ] **Step 3: Verify generated env files are committed if changed**

Run:

```bash
git status --short
```

Expected result: no output. If the only changes are generated `sst-env.d.ts` files, run:

```bash
git add sst-env.d.ts packages/*/sst-env.d.ts
git commit -m "Update SST env for auth Worker"
```

Then rerun:

```bash
git status --short
```

Expected result after committing generated files: no output.

### Task 6: Final Verification And Implementation Log

**Files:**
- Modify: `design/implementation/log.md`
- Modify: `design/implementation/roadmap.md`

- [ ] **Step 1: Run final functions package verification**

Run:

```bash
npm test --workspace packages/functions
npm run typecheck --workspace packages/functions
```

Expected result:

```txt
functions Vitest exits 0 with 2 tests passing
functions typecheck exits 0
```

- [ ] **Step 2: Run existing package verification**

From the repo root, run:

```bash
npm test --workspace packages/db
npm run typecheck --workspace packages/db
npx tsc -p packages/core/tsconfig.json --noEmit
npx tsc -p packages/scripts/tsconfig.json --noEmit
```

Then run the core Vitest check from `packages/core`:

```bash
npx sst shell --stage dev -- vitest --run
```

Expected result:

```txt
DB Vitest exits 0 with 2 tests passing
DB typecheck exits 0
core TypeScript exits 0
scripts TypeScript exits 0
core Vitest exits 0 with 1 test passing
```

- [ ] **Step 3: Run final SST verification**

Run:

```bash
npx sst diff --stage dev --print-logs
```

Expected result:

```txt
exit code 0
no pending AuthApi or Database changes are reported
```

- [ ] **Step 4: Capture implementation commit hashes**

Run:

```bash
git log --oneline -5
```

Expected result: the recent commits include:

```txt
Document auth Worker health route
Add auth Worker infrastructure
Add auth Worker health handler
```

If Task 5 created an `Update SST env for auth Worker` commit, include that commit hash too.

- [ ] **Step 5: Update the implementation log**

Append a `Completed Slice: 003-auth-worker-health` section to `design/implementation/log.md`.

The section must include:

```txt
slice name
commit hashes from Step 4
files changed
deployment command and result
verification commands from Steps 1, 2, and 3
verification results from Steps 1, 2, and 3
remaining note: registration, login, cookies, JWTs, password hashing, email, and D1 queries are still intentionally unimplemented.
```

- [ ] **Step 6: Update the roadmap**

Replace the current-slice section in `design/implementation/roadmap.md` with:

~~~md
## Current Slice

```txt
No active implementation slice is planned in detail.
```

The next candidate slice is:

```txt
004-api-worker-health
```

Goal: add `packages/functions/src/api.ts` as a Cloudflare Worker with a health route and access-JWT parsing left out.

Detailed plan status:

```txt
to be written before implementation
```
~~~

Ensure the future-slices list no longer includes `004-api-worker-health` as an unplanned future item once it is named as the next candidate.

- [ ] **Step 7: Commit the implementation log and roadmap update**

Run:

```bash
git add design/implementation/log.md design/implementation/roadmap.md
git commit -m "Record auth Worker health slice"
```

Expected result: commit succeeds and changes only `design/implementation/log.md` and `design/implementation/roadmap.md`.
