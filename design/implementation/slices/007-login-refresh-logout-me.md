# Login Refresh Logout Me Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement login, access JWT cookies, refresh cookies, logout, refresh, and `/api/me`.

**Architecture:** AuthApi owns login, refresh, and logout. Api owns `/api/me` because it represents the app API surface. AuthApi signs 2-hour access JWTs and issues 14-day opaque refresh tokens. Refresh token hashes are stored in D1. Api verifies access JWTs and loads the current user from D1 for `/api/me`.

**Tech Stack:** Cloudflare Workers, D1, Web Crypto HMAC JWT signing, bcrypt verification, SST-linked secrets, HTTP-only cookies.

---

## Data Scope

```txt
refresh_sessions
  id
  user_id
  token_hash
  created_at
  expires_at
  revoked_at
  replaced_by
  user_agent

login_attempts
  id
  username_or_email
  username_or_email_normalized
  success
  failure_code
  created_at
```

## API Scope

```txt
POST /auth/login
  body: { "usernameOrEmail": string, "password": string }
  success: 200 { "user": PublicCurrentUser }
  sets ccc_access_token and ccc_refresh_token cookies

POST /auth/refresh
  success: 200 { "user": PublicCurrentUser }
  rotates refresh token and sets fresh cookies

POST /auth/logout
  success: 204
  revokes current refresh token when present
  clears access and refresh cookies

GET /api/me
  success: 200 { "user": PublicCurrentUser }
  anonymous: 401 AUTH_REQUIRED
```

## Stable Error Codes

```txt
AUTH_INVALID_JSON
AUTH_VALIDATION_FAILED
AUTH_INVALID_CREDENTIALS
AUTH_EMAIL_NOT_VERIFIED
AUTH_ACCOUNT_DISABLED
AUTH_REFRESH_REQUIRED
AUTH_REFRESH_INVALID
AUTH_ROUTE_NOT_FOUND
API_AUTH_REQUIRED
API_AUTH_INVALID
API_ROUTE_NOT_FOUND
```

## Cookie Rules

```txt
ccc_access_token
  JWT
  2-hour lifetime
  HTTP-only
  Secure in production
  SameSite=Lax
  Path=/api

ccc_refresh_token
  opaque random token
  14-day lifetime
  HTTP-only
  Secure in production
  SameSite=Lax
  Path=/auth
```

## Secrets And Config

```txt
JwtSigningSecret
  SST secret linked to AuthApi and Api.

RefreshTokenSecret
  SST secret linked only to AuthApi.
```

## Out Of Scope

```txt
admin membership approval
password reset
rate limiting beyond recording login_attempts
frontend form submission
remember-me settings
multi-device session management UI
```

### Task 1: Add Session Migration

- [ ] Create `packages/db/migrations/0003_auth_sessions.sql`.
- [ ] Create `refresh_sessions` and `login_attempts`.
- [ ] Add indexes for active refresh sessions and login attempt lookup.
- [ ] Update DB migration metadata and tests.
- [ ] Apply the migration to dev D1.

### Task 2: Add JWT And Cookie Helpers

- [ ] Add HMAC JWT sign/verify helpers with tests.
- [ ] Add cookie serialization/parsing helpers with tests.
- [ ] Add refresh token generation/hash helpers with tests.
- [ ] Keep cookie attributes explicit and covered by tests.

### Task 3: Implement POST /auth/login

- [ ] Parse and validate login body.
- [ ] Look up user by normalized username or email.
- [ ] Verify bcrypt password hash with PasswordPepper.
- [ ] Reject disabled or unverified users with stable error codes.
- [ ] Create refresh session and login_attempt row.
- [ ] Set access and refresh cookies.

### Task 4: Implement POST /auth/refresh

- [ ] Read and hash refresh cookie.
- [ ] Reject missing, invalid, expired, or revoked sessions.
- [ ] Rotate refresh session.
- [ ] Set fresh access and refresh cookies.

### Task 5: Implement POST /auth/logout

- [ ] Revoke the current refresh session when a valid refresh cookie is present.
- [ ] Clear access and refresh cookies.
- [ ] Return 204.

### Task 6: Implement GET /api/me

- [ ] Verify access JWT from cookie.
- [ ] Load current user from D1.
- [ ] Return public user shape.
- [ ] Reject missing/invalid access tokens with stable API error codes.

### Task 7: Deploy And Record

- [ ] Link `JwtSigningSecret` to AuthApi and Api.
- [ ] Link `RefreshTokenSecret` only to AuthApi.
- [ ] Run package tests and typechecks.
- [ ] Deploy dev.
- [ ] Live-check login, refresh, logout, and `/api/me` with a test user.
- [ ] Update design docs, implementation log, and roadmap.
