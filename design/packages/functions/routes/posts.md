# Routes: /api/posts/*

## Worker

App API Worker.

## Routes

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

## Rules

Members can create drafts, publish drafts, edit their own posts, and soft-delete their own posts. Admins can toggle public visibility and soft-delete published posts. Admins cannot edit member-authored content and cannot see another user's drafts.

Post create/edit bodies use `bodyJson`, a restricted BlockNote-compatible JSON document stored as text in D1. The backend accepts paragraph blocks with plain text, bold text, italic text, and links only. Unsupported block types, uploads, media, tables, nested child blocks, oversized documents, and empty flattened text are rejected with `API_VALIDATION_FAILED`.

New posts always default to member-only visibility with `is_public = false`, including posts created by admins. When an admin publishes their own draft, the request may include an explicit immediate-public option that sets `is_public = true`; the default remains `false`. Non-admin publish requests with an immediate-public option must be rejected.

## Current Stable Error Codes

```txt
API_AUTH_REQUIRED
API_AUTH_INVALID
API_FORBIDDEN
API_POST_NOT_FOUND
API_VALIDATION_FAILED
API_ROUTE_NOT_FOUND
```
