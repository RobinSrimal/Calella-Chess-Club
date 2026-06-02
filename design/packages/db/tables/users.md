# Table: users

## Purpose

Stores accounts, membership state, role, and password hash metadata.

## Columns

```txt
id
username unique
email unique
password_hash
password_hash_algorithm
account_status: active | disabled
membership_status: none | pending | member | rejected
role: user | admin
email_verified_at
created_at
updated_at
disabled_at
disabled_by
```

## Rules

Passwords are never stored plaintext or encrypted. Store salted bcrypt-compatible hashes. After email verification, `membership_status` becomes `pending`. Rejected membership does not disable the account.
