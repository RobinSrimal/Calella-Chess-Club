# Route: /[locale]/admin/events

## Intended File

```txt
packages/web/src/pages/[locale]/admin/events.astro
```

## Purpose

Admin moderation and public visibility for published events.

## Features

```txt
view published events
mark published event public
mark public event member-only
soft-delete published event
```

Admins cannot edit member-authored event content and cannot see other users' drafts.

Admin-authored events are not public by default. Immediate public publishing is an explicit unchecked option in the admin user's own event publishing workflow; otherwise events are member-only until marked public here.
