# Infrastructure Overview

## Purpose

Infrastructure is defined in `infra/` using SST. The app is Cloudflare-first: website hosting, API execution, and database storage all run on Cloudflare.

## Intended Files

```txt
infra/
  cloudflare.ts
  website.ts
  workers.ts
  db.ts
  secrets.ts
```

`sst.config.ts` imports these files and returns useful outputs such as the website URL.

## Resources

```txt
Cloudflare Astro site:
  packages/web

Cloudflare auth Worker:
  packages/functions/src/auth.ts
  route: /auth/*

Cloudflare app API Worker:
  packages/functions/src/api.ts
  route: /api/*

Cloudflare D1:
  schema and migrations owned by packages/db

Secrets:
  JWT signing secret or key material
  refresh token hashing secret if needed
  optional password pepper
  Resend API key
```

No R2 bucket is needed in version 1 because the app has no uploads.

## Environment Rules

Use separate SST stages for development and production. Production cookies must be `Secure`. Production data must be retained by destructive infrastructure operations.
