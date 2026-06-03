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

GET /api/admin/users
  Requires an active, verified admin account.
  Supports membershipStatus, role, and accountStatus filters.
  Returns admin-safe user summaries.

POST /api/admin/users/:id/approve-membership
POST /api/admin/users/:id/reject-membership
POST /api/admin/users/:id/restore-membership
POST /api/admin/users/:id/disable
  Requires an active, verified admin account.
  Changes membership state or disables an account.
  Account disablement revokes active refresh sessions.

GET /api/posts
POST /api/posts
GET /api/posts/:id
PUT /api/posts/:id
POST /api/posts/:id/publish
POST /api/posts/:id/public
POST /api/posts/:id/member-only
DELETE /api/posts/:id
  Requires an active, verified approved member or admin account.
  Drafts are visible only to their author.
  Published posts are visible to approved members and admins.
  Admins can toggle public visibility on published posts.
  Deletes are soft deletes.
```

## Future Responsibilities

```txt
member events
public posts/events
stable error-code responses
```

## Authorization Rule

General member routes may trust non-sensitive claims from a valid, unexpired access JWT. Admin and account-sensitive routes must re-check current user state in D1.
