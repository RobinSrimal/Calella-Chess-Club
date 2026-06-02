# DB Package Overview

## Purpose

`packages/db` owns the D1 schema and migrations.

## Intended Structure

```txt
packages/db/
  package.json
  migrations/
  src/
    schema.ts
```

## Tables

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

Each table has a matching design document under `design/packages/db/tables/`.
