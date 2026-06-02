# Table: login_attempts

## Purpose

Tracks failed login attempts for throttling.

## Columns

```txt
id
identifier
ip_address
failed_at
```

## Rules

The auth Worker records failures by username/email identifier and IP address. Responses stay generic and use stable error codes.
