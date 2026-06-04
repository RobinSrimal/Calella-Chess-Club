# React Web Package Overview

## Purpose

`packages/web-react` is the planned React Router replacement for the current Astro website package. It will be built with React, TypeScript, Tailwind, and React Router, and deployed to Cloudflare through SST.

## Migration Position

The package will run in parallel with `packages/web` during migration.

```txt
packages/web
  Current Astro website.
  Deployed as SST resource Web.

packages/web-react
  New React Router website.
  Deployed as SST resource ReactWeb.
```

The React app will reuse the existing backend Workers and D1 database. It must not create a separate database or fork backend data.

## Backend Access

The React app should keep the same-origin proxy model:

```txt
/auth/* -> AuthApi Worker binding
/api/*  -> Api Worker binding
```

Browser code should continue to call same-origin paths with `credentials: "same-origin"`.

## First Slice

The first slice creates the deployable shell, Tailwind setup, localized route skeleton, and proxy routes. Full feature migration remains split into later slices.

## Implemented Shell

```txt
React Router v7 framework mode
React 19
TypeScript
Tailwind CSS v4
Vite 7
Cloudflare Vite plugin
```

The package includes a Cloudflare Workers server entry and keeps a local-only `wrangler.local.jsonc` fallback for standalone package builds. SST still owns the real generated wrangler config during deploy through `SST_WRANGLER_PATH`.

The package intentionally uses the existing repo package scope:

```txt
@CCC/web-react
```

## Runtime Compatibility

`ReactWeb` deploys with Cloudflare Worker compatibility date `2025-08-15` and `nodejs_compat`.

React 19 server rendering imports `MessageChannel` through `react-dom/server.browser`. Cloudflare exposes `MessageChannel` globally by default on compatibility date `2025-08-15` or later. Do not add the explicit `expose_global_message_channel` flag with that date; Cloudflare rejects it because the flag is already default.
