# Routes: /auth/*

## Worker

Auth Worker.

## Current Routes

```txt
GET /auth/health
```

## Future Routes

```txt
POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/refresh
GET  /auth/verify-email
POST /auth/forgot-password
POST /auth/reset-password
```

## Error Format

All auth routes return stable error codes.

```json
{
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS"
  }
}
```

## Current Error Codes

```txt
AUTH_ROUTE_NOT_FOUND
```
