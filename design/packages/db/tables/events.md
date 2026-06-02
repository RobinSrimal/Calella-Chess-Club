# Table: events

## Purpose

Stores member-created calendar events.

## Columns

```txt
id
author_id
title
description_markdown
location
starts_at
ends_at
status: draft | published | deleted
is_public
published_at
created_at
updated_at
deleted_at
deleted_by
```

## Rules

Events are informational only in version 1. There is no recurrence and no RSVP. Drafts are visible only to the author. Public events are published events with `is_public = true`. Deletes are soft deletes.
