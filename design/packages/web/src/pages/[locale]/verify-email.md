# Route: /[locale]/verify-email

## Intended File

```txt
packages/web/src/pages/[locale]/verify-email.astro
```

## Purpose

Handles email verification links.

## Query Parameters

```txt
token
```

## Submit

```txt
GET /auth/verify-email?token=...
```

After success, the user becomes an active account with pending membership. Show a translated pending-approval message.
