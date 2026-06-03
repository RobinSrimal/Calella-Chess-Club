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

POST /auth/register
  Validates username, email, password, and locale.
  Stores a bcrypt password hash with server-side pepper.
  Stores a hashed email verification token.
  Sends the raw verification token only through Resend email.
  Creates users with membership_status = none.

GET /auth/verify-email
  Validates a hashed email verification token.
  Marks the token used.
  Marks the email verified.
  Sets membership_status = pending.
```

## Future Responsibilities

```txt
log users in
issue access JWT cookies
issue refresh cookies
refresh access JWTs
log users out
send password reset email
reset passwords
record failed login attempts
```

## Secrets And Config

```txt
PasswordPepper:
  SST secret linked only to AuthApi.

ResendApiKey:
  SST secret linked only to AuthApi.

EMAIL_FROM:
  Non-secret Worker environment value.
  Current dev default is Calella Chess Club <onboarding@resend.dev>.

WEB_ORIGIN:
  Non-secret Worker environment value used to build email verification links.
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
