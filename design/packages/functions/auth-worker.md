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

POST /auth/login
  Validates username/email plus password.
  Verifies bcrypt-sha256-pepper password hashes.
  Rejects disabled or email-unverified users with stable error codes.
  Records login attempts.
  Issues a 2-hour access JWT cookie and a 14-day refresh cookie.

POST /auth/refresh
  Reads the refresh cookie.
  Validates the keyed refresh-token hash from D1.
  Rotates the refresh session.
  Issues fresh access and refresh cookies.

POST /auth/logout
  Revokes the current refresh session when present.
  Clears access and refresh cookies.
```

## Future Responsibilities

```txt
send password reset email
reset passwords
```

## Secrets And Config

```txt
PasswordPepper:
  SST secret linked only to AuthApi.

ResendApiKey:
  SST secret linked only to AuthApi.

JwtSigningSecret:
  SST secret linked to AuthApi and Api.
  AuthApi signs access JWTs.

RefreshTokenSecret:
  SST secret linked only to AuthApi.
  AuthApi stores keyed refresh-token hashes.

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

## Browser Cookie Caveat

```txt
The current dev Worker URLs are on separate workers.dev hostnames:
AuthApiUrl and ApiUrl do not share browser cookies automatically.

The backend contract is implemented and live-checked by passing cookies explicitly.
The browser flow needs same-domain routing or a website proxy before frontend auth forms
can rely on the cookies across AuthApi and Api.
```
