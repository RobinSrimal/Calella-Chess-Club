# Infrastructure Design

## Purpose

Infrastructure is defined in `infra/` using SST. The app is Cloudflare-first: website hosting, API execution, and database storage all run on Cloudflare.

## Resources

Expected SST resources:

```txt
Cloudflare Astro site:
  packages/web
  public website, login/register, member UI, admin UI

Cloudflare Auth Worker:
  packages/functions
  REST-style JSON API for /auth/*

Cloudflare App API Worker:
  packages/functions
  REST-style JSON API for /api/*

Cloudflare D1:
  application database
  schema and migrations owned by packages/db

Secrets:
  JWT signing secret or key material
  refresh/session token hashing secret if needed
  password pepper if used
  Resend API key
```

No R2 bucket is needed in version 1 because the app has no file uploads.

## Astro

Use `sst.cloudflare.Astro` for `packages/web`. The SST Astro component supports monorepos through `path: "packages/web"` and deploys Astro on Cloudflare.

The Astro Cloudflare adapter should use SST's generated Wrangler path, following SST's Cloudflare Astro guidance:

```ts
adapter: cloudflare({
  platformProxy: {
    configPath: process.env.SST_WRANGLER_PATH,
  },
})
```

## Workers

Use two `sst.cloudflare.Worker` resources for backend APIs.

The auth Worker handles registration, login, email verification, password reset, refresh, and logout. Its handler should live under `packages/functions`, for example:

```ts
new sst.cloudflare.Worker("AuthApi", {
  handler: "packages/functions/src/auth.ts",
});
```

The app API Worker handles current-user, admin, posts, events, and public-feed routes. Its handler should also live under `packages/functions`, for example:

```ts
new sst.cloudflare.Worker("Api", {
  handler: "packages/functions/src/api.ts",
});
```

Both Workers link to D1 and required secrets.

## D1

D1 schema and migrations are owned by `packages/db`. Infra creates and links the D1 database; application code does not create schema at runtime.

## Domains

The intended public domain is expected to route to the Astro site. API routing should keep cookies same-site and predictable:

```txt
/auth/* -> auth Worker
/api/*  -> app API Worker
```

The access JWT cookie should be scoped to `/api` so it is sent to the app API Worker. The refresh cookie should be scoped to `/auth` so it is only sent to auth endpoints.

## Environments

Use separate SST stages for local/dev and production. Production cookies must be `Secure`. Destructive removal behavior should retain production data.

## Operational Scripts

`packages/scripts` owns operational actions. The first admin is created by registering normally and then running a script that promotes that user to admin in D1. There is no public first-admin setup route.
