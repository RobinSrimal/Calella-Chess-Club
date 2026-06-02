# Table: password_reset_tokens

## Purpose

Stores one-way hashes of password reset tokens.

## Columns

```txt
id
user_id
token_hash
expires_at
used_at
created_at
```

## Rules

Tokens are short-lived and single-use. Successful reset updates `users.password_hash`, revokes all refresh sessions, and clears auth cookies.
