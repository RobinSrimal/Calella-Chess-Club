# Route: /[locale]/register

## Intended File

```txt
packages/web/src/pages/[locale]/register.astro
```

## Purpose

Registration form.

## Form Fields

```txt
username
email
password
```

## Submit

```txt
POST /auth/register
```

After success, show a translated message telling the user to verify their email.
