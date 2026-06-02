# Route: /[locale]/login

## Intended File

```txt
packages/web/src/pages/[locale]/login.astro
```

## Purpose

Login form for existing users.

## Form Fields

```txt
username or email
password
```

## Submit

```txt
POST /auth/login
```

Successful login redirects based on current user state from `GET /api/me`.

```txt
admin -> /[locale]/admin
member -> /[locale]/member
active non-member -> /[locale]/member with status screen
```
