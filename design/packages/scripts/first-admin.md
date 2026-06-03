# Script: First Admin Promotion

## Intended Location

```txt
packages/scripts/src/promote-first-admin.ts
```

## Purpose

Creates the first admin without a public setup route.

## Flow

```txt
user registers normally
user verifies email
operator runs script with username or email
script sets role = admin
```

No automatic first-user-becomes-admin behavior is allowed.

## Runtime

```txt
npx sst shell --stage dev -- npx tsx packages/scripts/src/promote-first-admin.ts <username-or-email>
```

The script runs locally inside `sst shell`. In that runtime, `Resource.Database` exposes D1 metadata, not a D1 binding with `prepare`. The script reads `Resource.Database.databaseId` and calls the Cloudflare D1 HTTP API.

Required environment:

```txt
CLOUDFLARE_API_TOKEN
CLOUDFLARE_DEFAULT_ACCOUNT_ID or CLOUDFLARE_ACCOUNT_ID
```

## Stable Script Error Codes

```txt
SCRIPT_USER_NOT_FOUND
SCRIPT_USER_NOT_VERIFIED
SCRIPT_USER_DISABLED
```
