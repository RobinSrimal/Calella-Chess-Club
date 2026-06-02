# Auth Registration And Email Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement user registration and email verification in the Auth Worker, backed by D1 tables for users and email verification tokens.

**Architecture:** The Auth Worker owns registration and verification routes. Registration creates a `users` row with a bcrypt password hash and an unverified email. It stores only a one-way hash of the email verification token, sends the raw token through Resend, and never stores the raw token. Email verification marks the token used, sets `email_verified_at`, and moves the user into `membership_status = pending` so an admin can accept or reject membership later.

**Tech Stack:** Cloudflare Worker, D1, SST-linked secrets, Worker-compatible bcrypt implementation, Web Crypto, Resend HTTP API.

---

## File Structure

```txt
packages/db/migrations/0002_auth_registration.sql
  Creates users and email_verification_tokens with required indexes.

packages/db/src/schema.ts
packages/db/src/schema.test.ts
  Registers and tests the new migration metadata.

packages/functions/package.json
package-lock.json
  Adds a Worker-compatible bcrypt dependency if implementation confirms one is needed.

packages/functions/src/auth.ts
packages/functions/src/auth.test.ts
  Wires POST /auth/register and GET /auth/verify-email.

packages/functions/src/auth/
  Route handlers and auth-specific helpers.

packages/functions/src/shared/
  Shared JSON response, validation, D1, token, and email helpers as needed.

infra/workers.ts
infra/secrets.ts
sst.config.ts
sst-env.d.ts
packages/*/sst-env.d.ts
  Links auth secrets and non-secret email/base-url config to AuthApi.

design/packages/functions/auth-worker.md
design/packages/functions/routes/auth.md
design/packages/db/migrations.md
design/implementation/log.md
design/implementation/roadmap.md
  Design and implementation tracking updates.
```

## Data Scope

```txt
users
  id: text primary key
  username: text unique, normalized for lookup
  email: text unique, normalized for lookup
  password_hash: text
  password_hash_algorithm: text, expected bcrypt
  account_status: active | disabled
  membership_status: none | pending | member | rejected
  role: user | admin
  email_verified_at: nullable timestamp
  created_at: timestamp
  updated_at: timestamp
  disabled_at: nullable timestamp
  disabled_by: nullable user id

email_verification_tokens
  id: text primary key
  user_id: users.id
  token_hash: text unique
  expires_at: timestamp
  used_at: nullable timestamp
  created_at: timestamp
```

Registration creates `membership_status = none`. Verification changes it to `pending`. Admin membership acceptance/rejection is out of scope for this slice.

## API Scope

```txt
POST /auth/register
  body: { "username": string, "email": string, "password": string, "locale"?: "ca" | "es" | "en" }
  success: 201 { "user": { "id": string, "username": string, "email": string, "emailVerified": false, "membershipStatus": "none", "role": "user" } }

GET /auth/verify-email?token=...
  success: 200 { "verified": true, "membershipStatus": "pending" }
```

## Stable Error Codes

```txt
AUTH_INVALID_JSON
AUTH_VALIDATION_FAILED
AUTH_USERNAME_TAKEN
AUTH_EMAIL_TAKEN
AUTH_EMAIL_SEND_FAILED
AUTH_VERIFICATION_TOKEN_INVALID
AUTH_VERIFICATION_TOKEN_EXPIRED
AUTH_VERIFICATION_TOKEN_USED
AUTH_ROUTE_NOT_FOUND
```

## Security Rules

```txt
Passwords are never stored plaintext or encrypted.
Store salted bcrypt password hashes only.
Use a server-side password pepper secret if configured.
If peppering with bcrypt, pre-hash password plus pepper before bcrypt to avoid bcrypt input-length truncation.
Email verification tokens are random, high-entropy, single-use values.
Only token hashes are stored in D1.
Verification token comparison uses hashes, not plaintext token lookup.
Registration and verification responses do not expose password hashes, token hashes, or secrets.
```

## Secrets And Config

```txt
PasswordPepper: SST secret linked only to AuthApi.
ResendApiKey: SST secret linked only to AuthApi.
EmailFrom: non-secret AuthApi environment value.
WebOrigin: non-secret AuthApi environment value used to build verification links.
```

## Out Of Scope

```txt
login
access JWT cookies
refresh cookies
logout
password reset
membership approval/rejection
admin screens
website form submission
rate limiting
CAPTCHA
custom email templates beyond basic localized text
```

### Task 1: Add Auth Registration Migration

- [ ] Create `packages/db/migrations/0002_auth_registration.sql`.
- [ ] Create `users` and `email_verification_tokens`.
- [ ] Add indexes for username lookup, email lookup, token hash lookup, and pending membership lookup.
- [ ] Update `packages/db/src/schema.ts`.
- [ ] Add schema metadata tests.
- [ ] Verify:

```bash
npm test --workspace packages/db
npm run typecheck --workspace packages/db
```

### Task 2: Add Auth Shared Helpers

- [ ] Add stable JSON response helpers.
- [ ] Add request JSON parsing and validation helpers.
- [ ] Add username/email normalization.
- [ ] Add password hashing and verification helpers using bcrypt.
- [ ] Add random token generation and token hash helpers.
- [ ] Add focused unit tests for validation, hashing metadata, and token hashing.
- [ ] Verify:

```bash
npm test --workspace packages/functions
npm run typecheck --workspace packages/functions
```

### Task 3: Add Resend Email Helper

- [ ] Add a small Resend HTTP client using `fetch`.
- [ ] Add localized verification email subject/body for Catalan, Spanish, and English.
- [ ] Ensure the raw verification token is only used to build the outgoing email link.
- [ ] Mock `fetch` in tests; do not call Resend in unit tests.
- [ ] Verify:

```bash
npm test --workspace packages/functions
```

### Task 4: Implement POST /auth/register

- [ ] Parse and validate request body.
- [ ] Reject duplicate normalized username/email.
- [ ] Hash the password with bcrypt and password pepper support.
- [ ] Insert the user and verification token in a D1 transaction if D1 supports it in this runtime; otherwise keep failure behavior explicit and tested.
- [ ] Send the verification email through the Resend helper.
- [ ] Return the public user shape with `membershipStatus = "none"`.
- [ ] Verify duplicate and validation error codes with tests.

### Task 5: Implement GET /auth/verify-email

- [ ] Hash the provided token and look up an unused verification token.
- [ ] Reject missing, invalid, expired, and already-used tokens with stable error codes.
- [ ] Mark the token used.
- [ ] Set `email_verified_at`.
- [ ] Set `membership_status = pending`.
- [ ] Return `{ "verified": true, "membershipStatus": "pending" }`.
- [ ] Verify all paths with tests.

### Task 6: Wire SST Secrets And Deploy

- [ ] Add `infra/secrets.ts`.
- [ ] Link `PasswordPepper` and `ResendApiKey` only to `AuthApi`.
- [ ] Add non-secret `EmailFrom` and `WebOrigin` environment values.
- [ ] Run `npx sst diff --stage dev --print-logs` and confirm no D1 replacement.
- [ ] Run the D1 migration explicitly.
- [ ] Deploy the dev stage.
- [ ] Run live registration and verification checks against dev using a test email setup that does not spam real members.

### Task 7: Record The Slice

- [ ] Update auth route and worker design docs.
- [ ] Update DB migration design docs if implementation scope changes.
- [ ] Update `design/implementation/log.md`.
- [ ] Update `design/implementation/roadmap.md`.
- [ ] Commit implementation and design-log changes separately where useful.
