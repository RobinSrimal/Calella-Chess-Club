# Table: email_verification_tokens

## Purpose

Stores one-way hashes of email verification tokens.

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

Tokens are short-lived and single-use. Successful verification marks the token used, marks the user email verified, activates the account, and creates pending membership.
