# Routes: /api/*

## Worker

App API Worker.

## Current Routes

```txt
GET /api/health
```

## Future Route Groups

```txt
/api/me
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
API_ROUTE_NOT_FOUND
```
