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

Future schema migration
  Creates users, email_verification_tokens, password_reset_tokens, refresh_sessions, login_attempts, posts, events, and audit_events.
```

## First Schema Migration Scope

The first schema migration creates:

```txt
users
email_verification_tokens
password_reset_tokens
refresh_sessions
login_attempts
posts
events
audit_events
```

Indexes should support login lookup, token lookup, active sessions, member content lists, public landing feeds, and admin membership queues.
