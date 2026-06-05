# React Web Package Overview

## Purpose

`packages/web-react` is the active website package. It is built with React, TypeScript, Tailwind, and React Router, and deployed to Cloudflare through SST.

## Migration Position

The package is the only active website package.

```txt
packages/web-react
  React Router website.
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

## Current Migration Scope

The first ReactWeb slice created the deployable shell, Tailwind setup, localized route skeleton, and proxy routes. Login, registration, email verification, password utility route placeholders, admin user management, and member posts have also been migrated.

Remaining UI migrations include member events and admin post/event subpages. The existing backend Workers and D1 data are reused for those flows.

Password reset is not implemented by the backend yet. ReactWeb currently exposes localized forgot/reset password pages as informational support pages only.

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

## Route Collision Rule

Keep auth and admin utility page routes explicit per locale instead of using patterns such as `/:locale/login`, `/:locale/verify-email`, or `/:locale/admin/users`. Dynamic locale routes can intercept same-origin `/auth/*` and `/api/*` proxy requests before the proxy routes run.

Member post routes are also explicit per locale:

```txt
/ca/member/posts
/es/member/posts
/en/member/posts
```

Member posts use a separate required title field plus restricted BlockNote-compatible body JSON. The React editor schema is limited to paragraphs, text, links, bold, and italic. The backend remains authoritative for validation and rejects unsupported blocks, uploads, media, lists, headings, nesting, arbitrary styles, and empty body text.

Admins use the same member posts workflow as members. Admin-authored posts remain member-only by default; admins can explicitly opt into landing-page visibility when publishing their own draft.
