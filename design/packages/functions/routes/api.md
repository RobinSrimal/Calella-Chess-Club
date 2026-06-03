# Routes: /api/*

## Worker

App API Worker.

## Current Routes

```txt
GET /api/health
GET /api/public/posts
GET /api/public/events
GET /api/me
GET /api/admin/users
POST /api/admin/users/:id/approve-membership
POST /api/admin/users/:id/reject-membership
POST /api/admin/users/:id/restore-membership
POST /api/admin/users/:id/disable
GET /api/posts
POST /api/posts
GET /api/posts/:id
PUT /api/posts/:id
POST /api/posts/:id/publish
POST /api/posts/:id/public
POST /api/posts/:id/member-only
DELETE /api/posts/:id
GET /api/events
POST /api/events
GET /api/events/:id
PUT /api/events/:id
POST /api/events/:id/publish
POST /api/events/:id/public
POST /api/events/:id/member-only
DELETE /api/events/:id
```

## Error Format

All App API routes return stable error codes.

```json
{
  "error": {
    "code": "API_ROUTE_NOT_FOUND"
  }
}
```

## Current Error Codes

```txt
API_AUTH_INVALID
API_AUTH_REQUIRED
API_EVENT_NOT_FOUND
API_FORBIDDEN
API_POST_NOT_FOUND
API_ROUTE_NOT_FOUND
API_USER_NOT_FOUND
API_VALIDATION_FAILED
```
