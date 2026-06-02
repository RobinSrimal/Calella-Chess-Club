# Functions Design

## Purpose

`packages/functions` contains one Cloudflare Worker API. The API is REST-style JSON and is responsible for auth, membership administration, posts, events, and public content feeds.

## Route Groups

Expected route groups:

```txt
/auth/*
/me
/admin/users/*
/posts/*
/events/*
/public/*
```

## Auth Responsibilities

The Worker:

```txt
registers users
verifies email tokens
logs users in
issues access JWT cookies
issues refresh cookies
refreshes access JWTs
logs users out
handles password reset
checks authorization for protected routes
records failed login attempts
```

Sensitive and admin routes re-check the current user/account/membership state in D1 instead of trusting only JWT claims.

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

The Worker supports:

```txt
automatic pending membership request after verified registration
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
GET /me
```

Admin users:

```txt
GET  /admin/users
POST /admin/users/:id/approve-membership
POST /admin/users/:id/reject-membership
POST /admin/users/:id/restore-membership
POST /admin/users/:id/disable
```

Posts:

```txt
GET    /posts
POST   /posts
GET    /posts/:id
PUT    /posts/:id
POST   /posts/:id/publish
POST   /posts/:id/public
POST   /posts/:id/member-only
DELETE /posts/:id
```

Events:

```txt
GET    /events
POST   /events
GET    /events/:id
PUT    /events/:id
POST   /events/:id/publish
POST   /events/:id/public
POST   /events/:id/member-only
DELETE /events/:id
```

Public:

```txt
GET /public/posts
GET /public/events
```
