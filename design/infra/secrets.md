# Secrets Infrastructure

## Purpose

Secrets are configured through SST and linked only to runtimes that require them.

## Required Secrets

```txt
JwtSigningSecret:
  auth Worker signs access JWTs
  app API Worker verifies access JWTs

RefreshTokenSecret:
  auth Worker stores keyed refresh-token hashes

PasswordPepper:
  required additional password-hash input

ResendApiKey:
  auth Worker sends email verification and password reset messages
```

## Exposure Rules

No auth secret is exposed to client-side code. Client-side environment variables must never contain auth secrets.
