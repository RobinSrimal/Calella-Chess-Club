# Routes: /auth/*

## Worker

Auth Worker.

## Routes

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

All routes return stable error codes.

```json
{
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS"
  }
}
```
