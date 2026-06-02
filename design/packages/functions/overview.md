# Functions Package Overview

## Purpose

`packages/functions` contains Cloudflare Worker APIs. The package keeps the current repo name even though the runtime resources are Workers.

## Intended Structure

```txt
packages/functions/src/
  auth.ts
  api.ts
  auth/
  api/
  shared/
```

`auth.ts` is the auth Worker entry point. `api.ts` is the app API Worker entry point.

Shared Worker utilities live under `shared/` and must not depend on Astro.
