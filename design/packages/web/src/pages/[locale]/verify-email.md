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

The page reads the token server-side, calls the AuthApi binding through `/auth/verify-email`, and renders the result.

After success, the user becomes an active account with pending membership. Show a translated pending-approval message and a login link.

Stable verification error-code messages are English-only.
