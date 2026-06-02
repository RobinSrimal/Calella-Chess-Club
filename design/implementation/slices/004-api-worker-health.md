# App API Worker Health Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the App API Worker entry point with an unauthenticated health route and wire it into SST/Cloudflare without implementing JWT parsing, user loading, posts, events, admin actions, or public feeds.

**Architecture:** `packages/functions/src/api.ts` becomes the App API Worker entry point and exports a small request handler that serves `GET /api/health`. `infra/workers.ts` adds a second Cloudflare Worker resource named `Api`, links it to the existing D1 database, enables a Worker URL for dev-stage verification, and `sst.config.ts` exposes that URL as `ApiUrl`. This slice keeps API behavior intentionally narrow: health plus a stable not-found error code.

**Tech Stack:** TypeScript, Vitest, Cloudflare Workers Fetch API, SST `sst.cloudflare.Worker`, Cloudflare D1 link.

---

## File Structure

```txt
packages/functions/src/api.ts
  App API Worker entry point. Replaces the current scaffold helper with `handleApiRequest()` and the default Worker fetch handler.

packages/functions/src/api.test.ts
  Unit tests for the health route and stable not-found error response.

infra/workers.ts
  Adds the Cloudflare Api Worker next to the existing AuthApi Worker and links both to the D1 Database resource.

sst.config.ts
  Returns `ApiUrl` in addition to `AuthApiUrl` and `DatabaseId`.

sst-env.d.ts
packages/*/sst-env.d.ts
  SST-generated resource type files if `sst diff` or `sst deploy` updates them.

design/packages/functions/api-worker.md
  Documents that this slice adds only `GET /api/health`.

design/packages/functions/routes/api.md
  Documents current `/api/*` health routing and the stable not-found code.

design/implementation/log.md
  Updated after the slice is completed.

design/implementation/roadmap.md
  Updated after the slice is completed to name the next candidate slice.
```

## Out Of Scope

```txt
JWT parsing
access-token validation
refresh-token handling
current-user loading
D1 queries
authorization checks
membership decisions
posts
events
public feeds
Astro integration
custom domains
shared routing abstraction
```

### Task 1: Add Red App API Health Tests

**Files:**
- Create: `packages/functions/src/api.test.ts`

- [ ] **Step 1: Write the failing API Worker tests**

Create `packages/functions/src/api.test.ts`:

```ts
import { expect, test } from "vitest";
import { handleApiRequest } from "./api";

test("GET /api/health returns api service status", async () => {
  const response = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/health"),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe(
    "application/json; charset=utf-8",
  );
  await expect(response.json()).resolves.toEqual({
    service: "api",
    status: "ok",
  });
});

test("unsupported api routes return a stable error code", async () => {
  const response = await handleApiRequest(
    new Request("https://calella-chess-club.test/api/me"),
  );

  expect(response.status).toBe(404);
  expect(response.headers.get("content-type")).toBe(
    "application/json; charset=utf-8",
  );
  await expect(response.json()).resolves.toEqual({
    error: {
      code: "API_ROUTE_NOT_FOUND",
    },
  });
});
```

- [ ] **Step 2: Run the test to verify it fails for the expected reason**

Run:

```bash
npm test --workspace packages/functions
```

Expected result:

```txt
FAIL packages/functions/src/api.test.ts
The failure is caused by ./api not exporting handleApiRequest.
```

The current `packages/functions/src/api.ts` scaffold exports `health()` instead of a Worker request handler. Do not change the test to call `health()`.

### Task 2: Implement App API Worker Health Handler

**Files:**
- Modify: `packages/functions/src/api.ts`

- [ ] **Step 1: Replace the scaffold API helper with the Worker handler**

Replace `packages/functions/src/api.ts` with:

```ts
export type ApiHealthResponse = {
  service: "api";
  status: "ok";
};

export type ApiErrorCode = "API_ROUTE_NOT_FOUND";

export type ApiErrorResponse = {
  error: {
    code: ApiErrorCode;
  };
};

type JsonBody = ApiHealthResponse | ApiErrorResponse;

export async function handleApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/api/health") {
    const body: ApiHealthResponse = {
      service: "api",
      status: "ok",
    };
    return jsonResponse(body);
  }

  const body: ApiErrorResponse = {
    error: {
      code: "API_ROUTE_NOT_FOUND",
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
  fetch: handleApiRequest,
};
```

- [ ] **Step 2: Run the functions tests**

Run:

```bash
npm test --workspace packages/functions
```

Expected result:

```txt
4 tests passed
```

The exact Vitest duration can differ. The important result is that both `auth.test.ts` and `api.test.ts` pass.

- [ ] **Step 3: Run the functions package typecheck**

Run:

```bash
npm run typecheck --workspace packages/functions
```

Expected result: exit code `0`.

- [ ] **Step 4: Commit the App API Worker handler**

Run:

```bash
git add packages/functions/src/api.test.ts packages/functions/src/api.ts
git commit -m "Add API Worker health handler"
```

Expected result: commit succeeds and includes only the files listed above.

### Task 3: Add App API Worker Infrastructure

**Files:**
- Modify: `infra/workers.ts`
- Modify: `sst.config.ts`
- Modify if generated: `sst-env.d.ts`
- Modify if generated: `packages/core/sst-env.d.ts`
- Modify if generated: `packages/db/sst-env.d.ts`
- Modify if generated: `packages/functions/sst-env.d.ts`
- Modify if generated: `packages/scripts/sst-env.d.ts`

- [ ] **Step 1: Add the Api Worker to the worker infra module**

Replace `infra/workers.ts` with:

```ts
import { database } from "./db";

export const authApi = new sst.cloudflare.Worker("AuthApi", {
  handler: "packages/functions/src/auth.ts",
  link: [database],
  url: true,
});

export const api = new sst.cloudflare.Worker("Api", {
  handler: "packages/functions/src/api.ts",
  link: [database],
  url: true,
});
```

- [ ] **Step 2: Return ApiUrl from SST config**

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
      ApiUrl: workers.api.url,
    };
  },
});
```

- [ ] **Step 3: Verify active infra references Api and no AWS resources**

Run:

```bash
grep -R "ApiUrl\\|new sst.cloudflare.Worker(\"Api\"\\|sst.aws\\|MyBucket\\|MyApi" -n sst.config.ts infra
```

Expected result:

```txt
sst.config.ts contains ApiUrl.
infra/workers.ts contains new sst.cloudflare.Worker("Api".
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
planned changes include a Cloudflare Worker named Api
planned changes do not replace or delete the existing Database D1 resource
planned changes do not replace or delete the existing AuthApi Worker
```

- [ ] **Step 5: Review generated SST env file changes**

Run:

```bash
git status --short
```

Expected result: source changes include `sst.config.ts` and `infra/workers.ts`. If SST generated resource type updates, they appear as changes to `sst-env.d.ts` and/or `packages/*/sst-env.d.ts`.

- [ ] **Step 6: Commit the App API Worker infrastructure**

Run:

```bash
git add sst.config.ts infra/workers.ts sst-env.d.ts packages/*/sst-env.d.ts
git commit -m "Add API Worker infrastructure"
```

Expected result: commit succeeds and includes `sst.config.ts`, `infra/workers.ts`, and any SST-generated env type files changed by the diff command.

### Task 4: Align App API Worker Design Documentation

**Files:**
- Modify: `design/packages/functions/api-worker.md`
- Create: `design/packages/functions/routes/api.md`

- [ ] **Step 1: Update the App API Worker design doc**

Replace `design/packages/functions/api-worker.md` with:

~~~md
# App API Worker

## Intended Entry Point

```txt
packages/functions/src/api.ts
```

## Purpose

Owns application data routes for current user, admin actions, posts, events, and public feeds.

## Current Implemented Scope

```txt
GET /api/health
  Returns the App API Worker health status.
```

## Future Responsibilities

```txt
verify access JWT cookie
load current user state from D1 for sensitive routes
serve current user profile
admin membership decisions
admin account disablement
member posts/events
public posts/events
stable error-code responses
```

## Authorization Rule

General member routes may trust non-sensitive claims from a valid, unexpired access JWT. Admin and account-sensitive routes must re-check current user state in D1.
~~~

- [ ] **Step 2: Add the API routes design doc**

Create `design/packages/functions/routes/api.md`:

~~~md
# Routes: /api/*

## Worker

App API Worker.

## Current Routes

```txt
GET /api/health
```

## Future Route Groups

```txt
/api/me
/api/admin/users/*
/api/posts/*
/api/events/*
/api/public/*
```

## Error Format

All App API routes return stable error codes.

```json
{
  "error": {
    "code": "API_ROUTE_NOT_FOUND"
  }
}
```

## Current Error Codes

```txt
API_ROUTE_NOT_FOUND
```
~~~

- [ ] **Step 3: Verify the design docs mention the health route and stable error code**

Run:

```bash
grep -R "GET /api/health\\|API_ROUTE_NOT_FOUND" -n design/packages/functions/api-worker.md design/packages/functions/routes/api.md
```

Expected result:

```txt
design/packages/functions/api-worker.md contains GET /api/health.
design/packages/functions/routes/api.md contains GET /api/health and API_ROUTE_NOT_FOUND.
```

- [ ] **Step 4: Commit the API design doc updates**

Run:

```bash
git add design/packages/functions/api-worker.md design/packages/functions/routes/api.md
git commit -m "Document API Worker health route"
```

Expected result: commit succeeds and changes only the two design docs listed above.

### Task 5: Deploy And Verify Dev App API Worker

**Files:**
- No source files should change. If `sst deploy` updates generated `sst-env.d.ts` files, commit those generated files with message `Update SST env for API Worker`.

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
output includes ApiUrl
Cloudflare creates or updates the Api Worker
```

- [ ] **Step 2: Verify the deployed health route through SST resource bindings**

Run from the repo root:

```bash
npx sst shell --stage dev -- node --input-type=module -e 'import { Resource } from "sst"; const response = await fetch(`${Resource.Api.url}/api/health`); console.log(response.status); console.log(await response.text());'
```

Expected result:

```txt
200
{"service":"api","status":"ok"}
```

- [ ] **Step 3: Run a post-deploy diff**

Run:

```bash
npx sst diff --stage dev --print-logs
```

Expected result:

```txt
exit code 0
no pending Api, AuthApi, or Database changes are reported
output includes the same DatabaseId, AuthApiUrl, and ApiUrl values from deploy
```

- [ ] **Step 4: Verify generated env files are committed if changed**

Run:

```bash
git status --short
```

Expected result: no output. If the only changes are generated `sst-env.d.ts` files, run:

```bash
git add sst-env.d.ts packages/*/sst-env.d.ts
git commit -m "Update SST env for API Worker"
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
functions Vitest exits 0 with 4 tests passing
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
no pending Api, AuthApi, or Database changes are reported
```

- [ ] **Step 4: Capture implementation commit hashes**

Run:

```bash
git log --oneline -6
```

Expected result: the recent commits include:

```txt
Document API Worker health route
Add API Worker infrastructure
Add API Worker health handler
```

If Task 5 created an `Update SST env for API Worker` commit, include that commit hash too.

- [ ] **Step 5: Update the implementation log**

Append a `Completed Slice: 004-api-worker-health` section to `design/implementation/log.md`.

The section must include:

```txt
slice name
commit hashes from Step 4
files changed
implemented route: GET /api/health
implemented stable error code: API_ROUTE_NOT_FOUND
deployment command and result
live verification command and result
verification commands from Steps 1, 2, and 3
verification results from Steps 1, 2, and 3
remaining note: JWT parsing, current-user loading, authorization, posts, events, public feeds, admin actions, and D1 queries are still intentionally unimplemented.
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
005-web-astro-shell
```

Goal: add `packages/web` Astro shell with locale routing and static route shells for public, auth, member, and admin pages.

Detailed plan status:

```txt
to be written before implementation
```
~~~

Ensure the future-slices list no longer includes `005-web-astro-shell` as an unplanned future item once it is named as the next candidate.

- [ ] **Step 7: Commit the implementation log and roadmap update**

Run:

```bash
git add design/implementation/log.md design/implementation/roadmap.md
git commit -m "Record API Worker health slice"
```

Expected result: commit succeeds and changes only `design/implementation/log.md` and `design/implementation/roadmap.md`.
