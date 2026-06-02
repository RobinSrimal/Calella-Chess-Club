# Library: api

## Intended File

```txt
packages/web/src/lib/api.ts
```

## Purpose

Small website-side API client for JSON requests to `/auth/*` and `/api/*`.

## Rules

```txt
send credentials with same-site cookies
parse stable API error codes
do not translate errors here
return typed data to pages/components
```

Translations belong to i18n files and UI components.
