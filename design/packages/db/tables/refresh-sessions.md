# Table: refresh_sessions

## Purpose

Stores hashed refresh tokens for 14-day login sessions.

## Columns

```txt
id
user_id
token_hash
created_at
expires_at
revoked_at
replaced_by
user_agent
```

## Rules

Refresh tokens are opaque random values. Only keyed token hashes are stored.
Sessions are rotated on refresh and revoked on logout, password reset, account disablement,
or forced re-login.
