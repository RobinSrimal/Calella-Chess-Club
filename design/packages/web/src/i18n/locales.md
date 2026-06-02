# I18n Dictionaries

## Intended Files

```txt
packages/web/src/i18n/ca.ts
packages/web/src/i18n/es.ts
packages/web/src/i18n/en.ts
```

## Purpose

Translate website UI chrome and API error codes.

## Rules

Catalan is the source/default language. Spanish and English dictionaries should use the same keys.

API responses return stable codes such as:

```txt
AUTH_INVALID_CREDENTIALS
AUTH_EMAIL_NOT_VERIFIED
MEMBERSHIP_NOT_APPROVED
```

The website maps those codes to localized messages.
