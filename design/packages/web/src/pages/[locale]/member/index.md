# Route: /[locale]/member

## Intended File

```txt
packages/web/src/pages/[locale]/member/index.astro
```

## Purpose

Member home screen.

## Access

Requires logged-in user. Approved members see member content. Pending or rejected users see status-specific messages and cannot access member posts/events.

## Data

```txt
GET /api/me
GET /api/posts
GET /api/events
```
