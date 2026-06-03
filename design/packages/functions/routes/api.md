# Routes: /api/*

## Worker

App API Worker.

## Current Routes

```txt
GET /api/health
GET /api/me
GET /api/admin/users
POST /api/admin/users/:id/approve-membership
POST /api/admin/users/:id/reject-membership
POST /api/admin/users/:id/restore-membership
POST /api/admin/users/:id/disable
```

## Future Route Groups

```txt
/api/posts/*
/api/events/*
/api/public/*
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
API_FORBIDDEN
API_ROUTE_NOT_FOUND
API_USER_NOT_FOUND
API_VALIDATION_FAILED
```
