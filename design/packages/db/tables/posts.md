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
