# Route: /[locale]/forgot-password

## Intended File

```txt
packages/web/src/pages/[locale]/forgot-password.astro
```

## Purpose

Starts the password reset flow.

## Form Fields

```txt
username or email
```

## Submit

```txt
POST /auth/forgot-password
```

The response message is generic and translated. It must not reveal whether the username or email exists.
