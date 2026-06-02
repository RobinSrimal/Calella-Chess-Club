# D1 Migrations

## Purpose

Migrations define the D1 schema. They are committed and run explicitly; request handlers do not create or mutate schema.

## Intended Location

```txt
packages/db/migrations/
```

## First Migration Scope

The first migration creates:

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
