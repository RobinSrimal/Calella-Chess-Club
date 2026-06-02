# Route: /

## Intended File

```txt
packages/web/src/pages/index.astro
```

## Purpose

The root route chooses the user's locale.

## Behavior

```txt
if ccc_locale is ca, es, or en:
  redirect to /{ccc_locale}
else:
  redirect to /ca
```

Catalan is the default locale.
