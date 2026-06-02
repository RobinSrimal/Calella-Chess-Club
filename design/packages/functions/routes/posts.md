# Routes: /api/posts/*

## Worker

App API Worker.

## Routes

```txt
GET    /api/posts
POST   /api/posts
GET    /api/posts/:id
PUT    /api/posts/:id
POST   /api/posts/:id/publish
POST   /api/posts/:id/public
POST   /api/posts/:id/member-only
DELETE /api/posts/:id
```

## Rules

Members can create drafts, publish drafts, edit their own posts, and soft-delete their own posts. Admins can toggle public visibility and soft-delete published posts. Admins cannot edit member-authored content and cannot see another user's drafts.
