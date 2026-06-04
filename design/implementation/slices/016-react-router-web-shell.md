# React Router Web Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a parallel React Router web package on Cloudflare, using React, TypeScript, and Tailwind, while reusing the existing AuthApi, Api, and D1 data.

**Architecture:** Keep the existing Astro `packages/web` app deployed as `Web` for now. Add a new `packages/web-react` app deployed as a separate Cloudflare React Router Worker, linked to the existing `AuthApi` and `Api` Workers. The React app owns same-origin `/auth/*` and `/api/*` proxy routes just like Astro, so browser code can keep using same-origin requests and cookies.

**Tech Stack:** React Router v7, React, TypeScript, Tailwind CSS, Vite, Cloudflare Workers, SST `sst.cloudflare.ReactRouter`, existing AuthApi and Api Workers.

---

## References

```txt
SST Cloudflare ReactRouter:
https://sst.dev/docs/component/cloudflare/react-router/

React Router framework mode:
https://reactrouter.com/start/framework/installation

Tailwind CSS with Vite:
https://tailwindcss.com/docs/installation/using-vite
```

The SST docs say `sst.cloudflare.ReactRouter` deploys a React Router v7 app to Cloudflare, supports `path`, exposes `url`, and supports `link` for linked resources. The docs also show that React Router apps on Cloudflare should use the Cloudflare Vite plugin with `configPath: process.env.SST_WRANGLER_PATH`.

## Context

The current website is Astro deployed through `sst.cloudflare.Astro("Web")` from `packages/web`. Astro currently provides:

```txt
localized public pages
auth forms
member pages
admin pages
same-origin /auth/* proxy to AuthApi
same-origin /api/* proxy to Api
```

The backend Workers and D1 database are reusable. This migration should not create separate backend data or a second database. The React app can share the same users, posts, events, auth sessions, and admin APIs.

The first React slice should not attempt to recreate every page. It should create the deployable package, shared route shell, Tailwind setup, and backend proxy foundation. Later slices can migrate auth forms, landing data, member posts, member events, and admin screens.

## File Structure

```txt
packages/web-react/package.json
packages/web-react/tsconfig.json
packages/web-react/vite.config.ts
packages/web-react/react-router.config.ts
packages/web-react/worker-configuration.d.ts
packages/web-react/app/root.tsx
packages/web-react/app/routes.ts
packages/web-react/app/styles/tailwind.css
packages/web-react/app/lib/proxy.ts
packages/web-react/app/lib/proxy.test.ts
packages/web-react/app/lib/locale.ts
packages/web-react/app/lib/locale.test.ts
packages/web-react/app/routes/home.tsx
packages/web-react/app/routes/proxy-auth.ts
packages/web-react/app/routes/proxy-api.ts
packages/web-react/public/images/club-hero.png

infra/web.ts
sst.config.ts
sst-env.d.ts
package-lock.json

design/packages/web-react/overview.md
design/packages/web-react/react-router-structure.md
design/infra/react-router-web.md
design/implementation/log.md
design/implementation/roadmap.md
```

## Scope

```txt
create packages/web-react as a new workspace package
configure React Router framework mode for Cloudflare through Vite
configure Tailwind CSS for the React app
add localized route shell for /, /ca, /es, and /en
add minimal placeholder member/admin/public pages as React routes only where needed to prove navigation
add same-origin /auth/* and /api/* proxy routes to the existing linked Workers
deploy the React app alongside the Astro app as a separate SST resource
export ReactWebUrl from sst.config.ts
copy or reference the current hero image so the React shell has real visual assets
add unit tests for locale routing and proxy URL forwarding
verify build, tests, dev deploy, and live proxy smoke through ReactWebUrl
```

## Out Of Scope

```txt
deleting Astro package or Astro infrastructure
moving custom domains
migrating the complete auth UI
migrating member posts BlockNote UI
migrating member events UI
migrating admin users UI
migrating admin content UI
changing backend Workers or D1 schema
creating a new database
changing auth cookie names or session semantics
```

## Resource Naming

```txt
Existing Astro website resource:
  Web
  packages/web
  output key: WebUrl

New React Router website resource:
  ReactWeb
  packages/web-react
  output key: ReactWebUrl
```

Keep both deployed during migration. Do not rename `Web` in this slice because that would make the existing deployed Astro URL churn and would complicate rollback.

## Routing Rules

```txt
GET /
  redirects to /ca

GET /ca
GET /es
GET /en
  renders a minimal localized React landing shell

GET /ca/member
GET /es/member
GET /en/member
  renders a placeholder member shell proving app navigation

GET /ca/admin
GET /es/admin
GET /en/admin
  renders a placeholder admin shell proving app navigation

ALL /auth/*
  forwards to linked AuthApi binding

ALL /api/*
  forwards to linked Api binding
```

The first React shell does not need full auth-aware redirects yet. It just needs the same-origin proxy routes working so later React auth/member/admin slices can reuse the same API helper pattern.

## Proxy Rules

The React Router app should preserve the current same-origin request model:

```txt
browser -> ReactWeb /auth/* -> AuthApi binding
browser -> ReactWeb /api/*  -> Api binding
```

Proxy implementation should preserve:

```txt
HTTP method
headers
query string
request body for non-GET/non-HEAD requests
response status
response headers
response body
```

Browser helpers for unsafe methods without payload should keep sending `content-type: application/json` with `{}` where needed. That rule is unchanged from the Astro app.

## Tailwind Rules

```txt
Use Tailwind for the new React package only.
Do not migrate Astro CSS in this slice.
Keep the first shell visually restrained and functional.
Use the real club hero image or existing visual assets.
Avoid introducing a component library in the first slice.
```

## Tasks

### Task 1: Scaffold React Router Package

**Files:**

```txt
Create: packages/web-react/package.json
Create: packages/web-react/tsconfig.json
Create: packages/web-react/vite.config.ts
Create: packages/web-react/react-router.config.ts
Create: packages/web-react/worker-configuration.d.ts
Modify: package-lock.json
```

- [ ] Add a new workspace package named `@CCC/web-react`.
- [ ] Add scripts: `dev`, `build`, `typecheck`, and `test`.
- [ ] Add React Router, React, React DOM, Vite, Cloudflare Vite plugin, Tailwind, TypeScript, and Vitest dependencies needed by the package.
- [ ] Configure Vite with Cloudflare plugin using `configPath: process.env.SST_WRANGLER_PATH`.
- [ ] Configure React Router framework mode.
- [ ] Run `npm install`.
- [ ] Run `npm run build --workspace packages/web-react` and expect failure only if app routes have not been created yet.

### Task 2: Add React App Shell And Tailwind

**Files:**

```txt
Create: packages/web-react/app/root.tsx
Create: packages/web-react/app/routes.ts
Create: packages/web-react/app/styles/tailwind.css
Create: packages/web-react/app/routes/home.tsx
Create: packages/web-react/app/lib/locale.ts
Create: packages/web-react/app/lib/locale.test.ts
Copy: packages/web/public/images/club-hero.png -> packages/web-react/public/images/club-hero.png
```

- [ ] Add locale helpers for `ca`, `es`, and `en`.
- [ ] Add tests proving `/` chooses Catalan and invalid locale params fall back to Catalan.
- [ ] Add a root document component with Tailwind stylesheet import.
- [ ] Add route definitions for `/`, `/:locale`, `/:locale/member`, and `/:locale/admin`.
- [ ] Add a minimal localized shell that uses the existing club image and links between member/admin/public placeholders.
- [ ] Run `npm test --workspace packages/web-react`.
- [ ] Run `npm run typecheck --workspace packages/web-react`.

### Task 3: Add Same-Origin Proxy Routes

**Files:**

```txt
Create: packages/web-react/app/lib/proxy.ts
Create: packages/web-react/app/lib/proxy.test.ts
Create: packages/web-react/app/routes/proxy-auth.ts
Create: packages/web-react/app/routes/proxy-api.ts
Modify: packages/web-react/app/routes.ts
```

- [ ] Port the current Astro proxy semantics into React Router route loaders/actions.
- [ ] Use `Resource.AuthApi` for `/auth/*`.
- [ ] Use `Resource.Api` for `/api/*`.
- [ ] Preserve method, headers, query string, body, response status, response headers, and response body.
- [ ] Add tests for matching prefix, rejecting out-of-prefix paths, preserving query strings, and forwarding a JSON POST body.
- [ ] Run `npm test --workspace packages/web-react`.
- [ ] Run `npm run typecheck --workspace packages/web-react`.

### Task 4: Add SST ReactWeb Resource

**Files:**

```txt
Modify: infra/web.ts
Modify: sst.config.ts
Modify: sst-env.d.ts
Create: design/infra/react-router-web.md
```

- [ ] Add `new sst.cloudflare.ReactRouter("ReactWeb", { path: "packages/web-react/", link: [api, authApi] })`.
- [ ] Keep the existing Astro `Web` resource unchanged.
- [ ] Export both `WebUrl` and `ReactWebUrl` from `sst.config.ts`.
- [ ] Document that `ReactWeb` is parallel migration infrastructure and does not replace Astro yet.
- [ ] Run `npx tsc --noEmit` if root TypeScript can check the SST config, otherwise run the package typechecks and `npx sst diff --stage dev`.

### Task 5: Verify And Deploy

**Files:**

```txt
Modify: design/packages/web-react/overview.md
Modify: design/packages/web-react/react-router-structure.md
Modify: design/implementation/log.md
Modify: design/implementation/roadmap.md
```

- [ ] Run `npm test --workspace packages/web-react`.
- [ ] Run `npm run typecheck --workspace packages/web-react`.
- [ ] Run `npm run build --workspace packages/web-react`.
- [ ] Run existing web tests that protect shared expectations where practical: `npm test --workspace packages/web`.
- [ ] Deploy dev with `npx sst deploy --stage dev`.
- [ ] Live-check `ReactWebUrl` returns 200 for `/ca`.
- [ ] Live-check `ReactWebUrl/api/health` returns the existing Api health response.
- [ ] Live-check `ReactWebUrl/auth/health` returns the existing AuthApi health response.
- [ ] Record ReactWebUrl and verification in the implementation log.
- [ ] Move the roadmap to the next migration or feature slice.

