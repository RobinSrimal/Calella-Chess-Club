# Table: refresh_sessions

## Purpose

Stores hashed refresh tokens for 14-day login sessions.

## Columns

```txt
id
user_id
token_hash
expires_at
revoked_at
created_at
last_used_at
```

## Rules

Refresh tokens are opaque random values. Only token hashes are stored. Sessions are revoked on logout, password reset, account disablement, or forced re-login.
