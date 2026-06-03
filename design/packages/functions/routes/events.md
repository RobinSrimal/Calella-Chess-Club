# Routes: /api/events/*

## Worker

App API Worker.

## Routes

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

## Rules

Events are informational only in version 1. Members can create drafts, publish drafts, edit their own events, and soft-delete their own events. Admins can toggle public visibility and soft-delete published events. Admins cannot edit member-authored content and cannot see another user's drafts.

New events always default to member-only visibility with `is_public = false`, including events created by admins. When an admin publishes their own draft, the request may include an explicit immediate-public option that sets `is_public = true`; the default remains `false`. Non-admin publish requests with an immediate-public option must be rejected.

## Current Stable Error Codes

```txt
API_AUTH_REQUIRED
API_AUTH_INVALID
API_FORBIDDEN
API_EVENT_NOT_FOUND
API_VALIDATION_FAILED
API_ROUTE_NOT_FOUND
```
