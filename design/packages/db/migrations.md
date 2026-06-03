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
  Creates posts for member-created Markdown posts. Superseded by 0006 for active post body storage.

0005_events.sql
  Creates events for member-created calendar events.

0006_posts_body_json.sql
  Rebuilds posts with body_json for restricted BlockNote-compatible JSON documents.

Future auth/session migrations
  Create password_reset_tokens.

Future content migrations
  Create audit_events.
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

Post rows store restricted BlockNote-compatible JSON body documents, draft/published/deleted status, public visibility, timestamps, and soft-delete metadata. Indexes support author draft lookups, published member feeds, and public post feeds.

## Events Migration Scope

The events migration creates:

```txt
events
```

Event rows store simple Markdown descriptions, optional location, start/end timestamps, draft/published/deleted status, public visibility, timestamps, and soft-delete metadata. Indexes support author draft lookups, published calendar ranges, and public event feeds.
