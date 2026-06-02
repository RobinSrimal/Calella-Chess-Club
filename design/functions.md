# Functions Design

## Purpose

`packages/functions` contains two Cloudflare Worker APIs. Both are REST-style JSON APIs and share D1-backed domain state.

The auth Worker owns authentication routes. The app API Worker owns current-user, membership administration, posts, events, and public content feeds.

## Route Groups

Expected route groups:

```txt
/auth/*        auth Worker
/api/me        app API Worker
/api/admin/*   app API Worker
/api/posts/*   app API Worker
/api/events/*  app API Worker
/api/public/*  app API Worker
```

## Auth Responsibilities

The auth Worker:

```txt
registers users
verifies email tokens
logs users in
issues access JWT cookies
issues refresh cookies
refreshes access JWTs
logs users out
handles password reset
records failed login attempts
```

The app API Worker verifies the access JWT cookie for protected routes. Sensitive and admin routes re-check the current user/account/membership state in D1 instead of trusting only JWT claims.

## Content Responsibilities

Posts and events share the same high-level status lifecycle:

```txt
draft
published
deleted
```

Drafts are visible only to the creator. Published content is visible to approved members. Public content is not a separate status; it is published content with `is_public = true`, additionally shown on the landing page. Deleted content is soft-deleted.

Members can create, publish, edit, and soft-delete their own posts/events. Admins can soft-delete published content and toggle public visibility, but cannot edit member-authored content.

## Membership Responsibilities

The auth Worker creates the pending membership request after email verification. The app API Worker supports the admin-side membership lifecycle:

```txt
admin approval
admin rejection
admin movement from rejected back to pending/member
admin account disablement
```

A rejected user remains an active user account but cannot access member content and cannot request membership again.

## Error Format

All error responses use stable codes and minimal machine-readable details.

Example:

```json
{
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS"
  }
}
```

The website owns localized display messages.

## REST Route Sketch

Auth:

```txt
POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/refresh
GET  /auth/verify-email
POST /auth/forgot-password
POST /auth/reset-password
```

Current user:

```txt
GET /api/me
```

Admin users:

```txt
GET  /api/admin/users
POST /api/admin/users/:id/approve-membership
POST /api/admin/users/:id/reject-membership
POST /api/admin/users/:id/restore-membership
POST /api/admin/users/:id/disable
```

Posts:

```txt
GET    /api/posts
POST   /api/posts
GET    /api/posts/:id
PUT    /api/posts/:id
POST   /api/posts/:id/publish
POST   /api/posts/:id/public
POST   /api/posts/:id/member-only
DELETE /api/posts/:id
```

Events:

```txt
GET    /api/events
POST   /api/events
GET    /api/events/:id
PUT    /api/events/:id
POST   /api/events/:id/publish
POST   /api/events/:id/public
POST   /api/events/:id/member-only
DELETE /api/events/:id
```

Public:

```txt
GET /api/public/posts
GET /api/public/events
```
