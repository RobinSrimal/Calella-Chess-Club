# Infrastructure Design

## Purpose

Infrastructure is defined in `infra/` using SST. The app is Cloudflare-first: website hosting, API execution, and database storage all run on Cloudflare.

## Resources

Expected SST resources:

```txt
Cloudflare Astro site:
  packages/web
  public website, login/register, member UI, admin UI

Cloudflare Worker:
  packages/functions
  REST-style JSON API

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

## Worker

Use one `sst.cloudflare.Worker` for the API. The handler should live under `packages/functions`, for example:

```ts
new sst.cloudflare.Worker("Api", {
  handler: "packages/functions/src/api.ts",
});
```

The Worker links to D1 and required secrets.

## D1

D1 schema and migrations are owned by `packages/db`. Infra creates and links the D1 database; application code does not create schema at runtime.

## Domains

The intended public domain is expected to route to the Astro site. API routes can either use a dedicated API subdomain or an `/api/*` route proxied to the API Worker. The implementation plan should pick one and keep same-site cookie behavior simple.

## Environments

Use separate SST stages for local/dev and production. Production cookies must be `Secure`. Destructive removal behavior should retain production data.

## Operational Scripts

`packages/scripts` owns operational actions. The first admin is created by registering normally and then running a script that promotes that user to admin in D1. There is no public first-admin setup route.
