# Route: /[locale]/reset-password

## Intended File

```txt
packages/web/src/pages/[locale]/reset-password.astro
```

## Purpose

Completes the password reset flow.

## Query Parameters

```txt
token
```

## Form Fields

```txt
new password
confirm new password
```

## Submit

```txt
POST /auth/reset-password
```

After success, the auth Worker updates the password hash, revokes refresh sessions, clears auth cookies, and the page redirects to login.
