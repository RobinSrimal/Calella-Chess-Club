# Routes: /api/*

## Worker

App API Worker.

## Current Routes

```txt
GET /api/health
GET /api/me
```

## Future Route Groups

```txt
/api/admin/users/*
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
API_ROUTE_NOT_FOUND
```
