# Route: /api/me

## Worker

App API Worker.

## Purpose

Returns current user, role, account status, and membership status.

## Response Shape

```json
{
  "user": {
    "id": "usr_123",
    "username": "player",
    "email": "player@example.com",
    "role": "user",
    "accountStatus": "active",
    "membershipStatus": "pending"
  }
}
```

Admin and membership-sensitive UI uses this response to route users.
