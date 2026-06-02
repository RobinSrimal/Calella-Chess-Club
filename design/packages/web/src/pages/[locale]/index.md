# Route: /[locale]

## Intended File

```txt
packages/web/src/pages/[locale]/index.astro
```

## Purpose

Localized public landing page for the club.

## Content

```txt
club intro
upcoming public events
public news/posts
contact/location
login/register links
language switcher
```

## Data

Fetches public posts and events from:

```txt
GET /api/public/posts
GET /api/public/events
```

Only admin-curated public content appears here.
