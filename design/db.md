# Database Design

## Purpose

`packages/db` owns the D1 schema and migrations. The database stores users, auth state, membership state, posts, events, and audit metadata.

## Core Tables

Expected tables:

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

## Users

Users separate account state, membership state, and role.

```txt
account_status:
  active
  disabled

membership_status:
  none
  pending
  member
  rejected

role:
  user
  admin
```

Registration creates a user with an email verification requirement. After email verification, the account is active and membership becomes pending.

Username and email are unique. Passwords are never stored encrypted or plaintext; only salted bcrypt-compatible hashes and hash metadata are stored.

## Auth Tables

Email verification tokens:

```txt
token_hash
user_id
expires_at
used_at
created_at
```

Password reset tokens:

```txt
token_hash
user_id
expires_at
used_at
created_at
```

Refresh sessions:

```txt
token_hash
user_id
expires_at
revoked_at
created_at
last_used_at
```

Login attempts:

```txt
identifier
ip_address
failed_at
```

## Posts

Posts store limited Markdown source.

Expected fields:

```txt
id
author_id
title
body_markdown
status: draft | published | deleted
is_public
published_at
created_at
updated_at
deleted_at
deleted_by
```

Draft posts are visible only to the author. Published posts are visible to approved members. Public posts are published posts with `is_public = true`.

## Events

Events are informational only in version 1. There is no recurrence and no RSVP.

Expected fields:

```txt
id
author_id
title
description_markdown
location
starts_at
ends_at
status: draft | published | deleted
is_public
published_at
created_at
updated_at
deleted_at
deleted_by
```

Draft events are visible only to the author. Published events are visible to approved members. Public events are published events with `is_public = true`.

## Audit Events

Audit events record important administrative and security-relevant actions.

Examples:

```txt
membership approved
membership rejected
membership restored
account disabled
post made public
post made member-only
post deleted
event made public
event made member-only
event deleted
password reset completed
refresh sessions revoked
```

## Soft Deletes

Posts and events use soft deletes.

```txt
deleted_at = null      active
deleted_at != null    hidden/deleted
deleted_by            user who deleted the row
```

Normal queries exclude deleted content.
