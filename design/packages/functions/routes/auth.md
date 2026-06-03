# Routes: /auth/*

## Worker

Auth Worker.

## Current Routes

```txt
GET /auth/health
POST /auth/register
GET /auth/verify-email
```

## Future Routes

```txt
POST /auth/login
POST /auth/logout
POST /auth/refresh
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
AUTH_EMAIL_SEND_FAILED
AUTH_EMAIL_TAKEN
AUTH_INVALID_JSON
AUTH_ROUTE_NOT_FOUND
AUTH_USERNAME_TAKEN
AUTH_VALIDATION_FAILED
AUTH_VERIFICATION_TOKEN_EXPIRED
AUTH_VERIFICATION_TOKEN_INVALID
AUTH_VERIFICATION_TOKEN_USED
```
