# App API Worker

## Intended Entry Point

```txt
packages/functions/src/api.ts
```

## Purpose

Owns application data routes for current user, admin actions, posts, events, and public feeds.

## Current Implemented Scope

```txt
GET /api/health
  Returns the App API Worker health status.

GET /api/me
  Reads the access JWT cookie.
  Verifies the HMAC JWT with JwtSigningSecret.
  Loads the current public user from D1.
  Returns stable API auth errors for missing or invalid tokens.
```

## Future Responsibilities

```txt
admin membership decisions
admin account disablement
member posts/events
public posts/events
stable error-code responses
```

## Authorization Rule

General member routes may trust non-sensitive claims from a valid, unexpired access JWT. Admin and account-sensitive routes must re-check current user state in D1.
