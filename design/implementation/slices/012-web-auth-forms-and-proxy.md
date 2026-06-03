# Web Auth Forms And Proxy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make registration and login work from the Astro website, with same-origin proxy routes that preserve auth cookies for future member/admin UI.

**Architecture:** The website remains Astro-first and adds React islands only for interactive forms. The Web worker owns browser-facing `/auth/*` and `/api/*` proxy endpoints that forward requests to the linked AuthApi and Api service bindings. This keeps cookies on the website origin, so browser UI can authenticate without calling separate Worker domains directly.

**Tech Stack:** Astro, Astro endpoints, React islands, TypeScript, SST Cloudflare service bindings, AuthApi, Api.

---

## File Structure

```txt
packages/web/astro.config.mjs
packages/web/package.json
packages/web/src/lib/proxy.ts
packages/web/src/lib/proxy.test.ts
packages/web/src/lib/browser-api.ts
packages/web/src/components/forms/LoginForm.tsx
packages/web/src/components/forms/RegistrationForm.tsx
packages/web/src/pages/auth/[...path].ts
packages/web/src/pages/api/[...path].ts
packages/web/src/pages/[locale]/login.astro
packages/web/src/pages/[locale]/register.astro
packages/web/src/styles/global.css
```

## Scope

```txt
POST /auth/register through the website origin
POST /auth/login through the website origin
GET /api/me through the website origin
React login form island
React registration form island
basic success/error states
redirect logged-in members/admins to their app area after login
English-only stable error-code messages
```

## Out Of Scope

```txt
member post/event editors
admin approval UI
password reset UI
email verification UI improvements
client-side markdown editor
```

### Task 1: Add React Support

**Files:**

```txt
Modify: packages/web/package.json
Modify: packages/web/astro.config.mjs
```

- [x] Add `@astrojs/react`, `react`, and `react-dom`.
- [x] Register the Astro React integration.
- [x] Run `npm install`.
- [x] Run `npm run build --workspace packages/web`.
- [x] Commit.

### Task 2: Add Same-Origin Proxy Helper

**Files:**

```txt
Create: packages/web/src/lib/proxy.ts
Create: packages/web/src/lib/proxy.test.ts
```

- [x] Write tests for forwarding method, path, query string, body, headers, and cookies.
- [x] Write tests proving `Set-Cookie` response headers are preserved.
- [x] Implement `forwardToBinding(binding, request, prefix)`.
- [x] Run `npx vitest --run packages/web/src/lib/proxy.test.ts`.
- [x] Commit.

### Task 3: Add Web Proxy Endpoints

**Files:**

```txt
Create: packages/web/src/pages/auth/[...path].ts
Create: packages/web/src/pages/api/[...path].ts
```

- [x] Add an Astro endpoint that forwards `/auth/*` to `Resource.AuthApi`.
- [x] Add an Astro endpoint that forwards `/api/*` to `Resource.Api`.
- [x] Use `sst/resource/cloudflare` for Cloudflare-safe resource imports.
- [x] Run `npm run build --workspace packages/web`.
- [x] Commit.

### Task 4: Add Browser API Client

**Files:**

```txt
Create: packages/web/src/lib/browser-api.ts
```

- [x] Add typed helpers for `POST /auth/register`, `POST /auth/login`, and `GET /api/me`.
- [x] Always send `credentials: "same-origin"`.
- [x] Parse stable `{ error: { code } }` responses into user-facing state.
- [x] Add focused tests where browser fetch behavior can be mocked.
- [x] Commit.

### Task 5: Connect Login And Registration Forms

**Files:**

```txt
Create: packages/web/src/components/forms/LoginForm.tsx
Create: packages/web/src/components/forms/RegistrationForm.tsx
Modify: packages/web/src/pages/[locale]/login.astro
Modify: packages/web/src/pages/[locale]/register.astro
Modify: packages/web/src/styles/global.css
```

- [x] Replace static login form markup with a hydrated `LoginForm` island.
- [x] Replace static registration form markup with a hydrated `RegistrationForm` island.
- [x] Keep translated labels from the current dictionaries.
- [x] Show stable error-code driven messages without exposing raw JSON.
- [x] After successful login, call `/api/me` and route admins to `/{locale}/admin`, members to `/{locale}/member`, and pending users to `/{locale}/member`.
- [x] After successful registration, show the existing email-verification pending state.
- [x] Commit.

### Task 6: Verify And Deploy

- [x] Run `npm test --workspace packages/web`.
- [x] Run `npx tsc --noEmit -p packages/web/tsconfig.json`.
- [x] Run `npm test --workspace packages/functions`.
- [x] Run `npm run typecheck --workspace packages/functions`.
- [x] Run `npm run build --workspace packages/web`.
- [x] Deploy with `npx sst deploy --stage dev`.
- [x] Browser-test registration and login on the dev Web URL.
- [x] Confirm `/api/me` works through the Web origin after login.
- [x] Update implementation log and roadmap.
