# Route: /[locale]/admin

## Intended File

```txt
packages/web/src/pages/[locale]/admin/index.astro
```

## Purpose

Admin dashboard.

## Access

Requires logged-in user with `role = admin`. The app API Worker re-checks admin state in D1.

## Content

```txt
pending membership count
recent public-content actions
links to users, posts, and events management
```
