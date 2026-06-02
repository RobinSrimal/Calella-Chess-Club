# Route: /[locale]/admin/posts

## Intended File

```txt
packages/web/src/pages/[locale]/admin/posts.astro
```

## Purpose

Admin moderation and public visibility for published posts.

## Features

```txt
view published posts
mark published post public
mark public post member-only
soft-delete published post
```

Admins cannot edit member-authored post content and cannot see other users' drafts.

Admin-authored posts are not public by default. Immediate public publishing is an explicit unchecked option in the admin user's own post publishing workflow; otherwise posts are member-only until marked public here.
