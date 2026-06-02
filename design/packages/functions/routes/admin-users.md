# Routes: /api/admin/users/*

## Worker

App API Worker.

## Access

Requires `role = admin`. The Worker re-checks current user state in D1.

## Routes

```txt
GET  /api/admin/users
POST /api/admin/users/:id/approve-membership
POST /api/admin/users/:id/reject-membership
POST /api/admin/users/:id/restore-membership
POST /api/admin/users/:id/disable
```

## Rules

Rejected users remain active accounts. Only admins can move a rejected membership back to pending/member. Disabled accounts cannot log in, and existing refresh sessions are revoked.
