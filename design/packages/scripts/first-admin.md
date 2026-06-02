# Script: First Admin Promotion

## Intended Location

```txt
packages/scripts/src/promote-first-admin.ts
```

## Purpose

Creates the first admin without a public setup route.

## Flow

```txt
user registers normally
user verifies email
operator runs script with username or email
script sets role = admin
script records audit event
```

No automatic first-user-becomes-admin behavior is allowed.
