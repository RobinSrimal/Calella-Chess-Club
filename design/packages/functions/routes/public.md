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

No authentication is required.

Posts are ordered newest published first and limited to the landing page feed count.

Events are ordered by upcoming `starts_at` ascending and limited to the landing page feed count.

## Response Shapes

```txt
GET /api/public/posts
  { posts: PublicPost[] }

GET /api/public/events
  { events: PublicEvent[] }
```
