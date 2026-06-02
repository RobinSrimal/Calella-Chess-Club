# Routes: /api/public/*

## Worker

App API Worker.

## Routes

```txt
GET /api/public/posts
GET /api/public/events
```

## Rules

Public feeds include only published, non-deleted content with `is_public = true`.
