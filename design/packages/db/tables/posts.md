# Table: posts

## Purpose

Stores member-created posts.

## Columns

```txt
id
author_id
title
body_markdown
status: draft | published | deleted
is_public
published_at
created_at
updated_at
deleted_at
deleted_by
```

## Rules

Drafts are visible only to the author. Published posts are visible to approved members. Public posts are published posts with `is_public = true`. Deletes are soft deletes.

`is_public` defaults to `false` for every post, including posts authored by admins. Admin-authored posts become public only when the admin explicitly chooses immediate public visibility during publishing or later marks the published post public.

## Indexes

```txt
idx_posts_author_status
idx_posts_published
idx_posts_public
```
