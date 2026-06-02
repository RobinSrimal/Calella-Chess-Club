# Secrets Infrastructure

## Purpose

Secrets are configured through SST and linked only to runtimes that require them.

## Required Secrets

```txt
JWT signing secret or key material:
  auth Worker signs access JWTs
  app API Worker verifies access JWTs

Refresh token secret:
  used if refresh token hashes need a keyed hash

Password pepper:
  optional additional password-hash input

Resend API key:
  auth Worker sends email verification and password reset messages
```

## Exposure Rules

No auth secret is exposed to client-side code. Astro client-side environment variables must use `PUBLIC_`; secrets must not.
