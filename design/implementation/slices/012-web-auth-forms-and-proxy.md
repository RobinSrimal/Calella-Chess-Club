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

- [ ] Add `@astrojs/react`, `react`, and `react-dom`.
- [ ] Register the Astro React integration.
- [ ] Run `npm install`.
- [ ] Run `npm run build --workspace packages/web`.
- [ ] Commit.

### Task 2: Add Same-Origin Proxy Helper

**Files:**

```txt
Create: packages/web/src/lib/proxy.ts
Create: packages/web/src/lib/proxy.test.ts
```

- [ ] Write tests for forwarding method, path, query string, body, headers, and cookies.
- [ ] Write tests proving `Set-Cookie` response headers are preserved.
- [ ] Implement `forwardToBinding(binding, request, prefix)`.
- [ ] Run `npx vitest --run packages/web/src/lib/proxy.test.ts`.
- [ ] Commit.

### Task 3: Add Web Proxy Endpoints

**Files:**

```txt
Create: packages/web/src/pages/auth/[...path].ts
Create: packages/web/src/pages/api/[...path].ts
```

- [ ] Add an Astro endpoint that forwards `/auth/*` to `Resource.AuthApi`.
- [ ] Add an Astro endpoint that forwards `/api/*` to `Resource.Api`.
- [ ] Use `sst/resource/cloudflare` for Cloudflare-safe resource imports.
- [ ] Run `npm run build --workspace packages/web`.
- [ ] Commit.

### Task 4: Add Browser API Client

**Files:**

```txt
Create: packages/web/src/lib/browser-api.ts
```

- [ ] Add typed helpers for `POST /auth/register`, `POST /auth/login`, and `GET /api/me`.
- [ ] Always send `credentials: "same-origin"`.
- [ ] Parse stable `{ error: { code } }` responses into user-facing state.
- [ ] Add focused tests where browser fetch behavior can be mocked.
- [ ] Commit.

### Task 5: Connect Login And Registration Forms

**Files:**

```txt
Create: packages/web/src/components/forms/LoginForm.tsx
Create: packages/web/src/components/forms/RegistrationForm.tsx
Modify: packages/web/src/pages/[locale]/login.astro
Modify: packages/web/src/pages/[locale]/register.astro
Modify: packages/web/src/styles/global.css
```

- [ ] Replace static login form markup with a hydrated `LoginForm` island.
- [ ] Replace static registration form markup with a hydrated `RegistrationForm` island.
- [ ] Keep translated labels from the current dictionaries.
- [ ] Show stable error-code driven messages without exposing raw JSON.
- [ ] After successful login, call `/api/me` and route admins to `/{locale}/admin`, members to `/{locale}/member`, and pending users to `/{locale}/member`.
- [ ] After successful registration, show the existing email-verification pending state.
- [ ] Commit.

### Task 6: Verify And Deploy

- [ ] Run `npm test --workspace packages/web`.
- [ ] Run `npx tsc --noEmit -p packages/web/tsconfig.json`.
- [ ] Run `npm test --workspace packages/functions`.
- [ ] Run `npm run typecheck --workspace packages/functions`.
- [ ] Run `npm run build --workspace packages/web`.
- [ ] Deploy with `npx sst deploy --stage dev`.
- [ ] Browser-test registration and login on the dev Web URL.
- [ ] Confirm `/api/me` works through the Web origin after login.
- [ ] Update implementation log and roadmap.
