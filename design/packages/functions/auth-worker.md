# Auth Worker

## Intended Entry Point

```txt
packages/functions/src/auth.ts
```

## Purpose

Owns username/password authentication and session refresh.

## Current Implemented Scope

```txt
GET /auth/health
  Returns the Auth Worker health status.
```

## Future Responsibilities

```txt
register users
send email verification through Resend
verify email tokens
create pending membership after email verification
log users in
issue access JWT cookies
issue refresh cookies
refresh access JWTs
log users out
send password reset email
reset passwords
record failed login attempts
```

## Cookies

```txt
ccc_access_token:
  JWT
  2-hour lifetime
  HTTP-only
  Secure in production
  SameSite=Lax
  Path=/api

ccc_refresh_token:
  opaque token
  14-day lifetime
  HTTP-only
  Secure in production
  SameSite=Lax
  Path=/auth
```
