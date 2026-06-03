# Table: login_attempts

## Purpose

Tracks failed login attempts for throttling.

## Columns

```txt
id
username_or_email
username_or_email_normalized
success
failure_code
created_at
```

## Rules

The auth Worker records parsed login attempts by username/email identifier. Failure codes use
stable auth error codes so future throttling and admin audit views can be added without changing
the response contract.
