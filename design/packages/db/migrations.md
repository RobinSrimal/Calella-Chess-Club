# D1 Migrations

## Purpose

Migrations define the D1 schema. They are committed and run explicitly; request handlers do not create or mutate schema.

## Intended Location

```txt
packages/db/migrations/
```

## Migration Sequence

```txt
0001_empty.sql
  Scaffold migration committed with the DB package. It contains no schema statements.

0002_auth_registration.sql
  Planned next. Creates users and email_verification_tokens for registration and email verification.

Future auth/session migrations
  Create password_reset_tokens, refresh_sessions, and login_attempts.

Future content migrations
  Create posts, events, and audit_events.
```

## Auth Registration Migration Scope

The first auth schema migration creates:

```txt
users
email_verification_tokens
```

Indexes should support username lookup, email lookup, token lookup, and the admin pending membership queue.
