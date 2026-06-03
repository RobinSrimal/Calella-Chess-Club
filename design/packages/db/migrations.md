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
  Creates users and email_verification_tokens for registration and email verification.

0003_auth_sessions.sql
  Creates refresh_sessions and login_attempts for login, refresh, and logout.

0004_posts.sql
  Creates posts for member-created Markdown posts.

Future auth/session migrations
  Create password_reset_tokens.

Future content migrations
  Create events and audit_events.
```

## Auth Registration Migration Scope

The first auth schema migration creates:

```txt
users
email_verification_tokens
```

Indexes should support username lookup, email lookup, token lookup, and the admin pending membership queue.

## Auth Session Migration Scope

The session migration creates:

```txt
refresh_sessions
login_attempts
```

Refresh token rows store keyed token hashes only. Login attempts record the submitted
username/email identifier, normalized lookup value, success flag, optional stable failure code,
and creation timestamp.

## Posts Migration Scope

The posts migration creates:

```txt
posts
```

Post rows store simple Markdown text, draft/published/deleted status, public visibility, timestamps, and soft-delete metadata. Indexes support author draft lookups, published member feeds, and public post feeds.
