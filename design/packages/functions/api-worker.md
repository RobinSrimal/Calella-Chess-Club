# App API Worker

## Intended Entry Point

```txt
packages/functions/src/api.ts
```

## Purpose

Owns application data routes for current user, admin actions, posts, events, and public feeds.

## Responsibilities

```txt
verify access JWT cookie
load current user state from D1 for sensitive routes
serve current user profile
admin membership decisions
admin account disablement
member posts/events
public posts/events
stable error-code responses
```

## Authorization Rule

General member routes may trust non-sensitive claims from a valid, unexpired access JWT. Admin and account-sensitive routes must re-check current user state in D1.
