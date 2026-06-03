# Public Landing Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose public post/event feeds and connect the localized landing page to public data.

**Architecture:** Api owns unauthenticated public feed routes. Public routes only return published, non-deleted rows with `is_public = true`. The Astro landing page fetches those routes server-side and renders localized empty states when no public content exists.

**Tech Stack:** Cloudflare Workers, D1, Astro, SST-linked Api service binding, simple Markdown text display, stable JSON error codes.

---

## API Scope

```txt
GET /api/public/posts
  returns published public posts
  orders newest published posts first

GET /api/public/events
  returns published public events
  orders upcoming events by starts_at ascending
```

## Web Scope

```txt
packages/web/src/pages/[locale]/index.astro
  fetch public posts and events
  render public posts section from API data
  render upcoming public events section from API data
  keep localized empty states
```

## Data Rules

```txt
only status = published
only is_public = true
never return drafts
never return deleted content
no authentication required
limit feeds to a small fixed count for the landing page
```

## Stable Error Codes

```txt
API_ROUTE_NOT_FOUND
```

Public feed routes should not expose auth errors because they do not require auth.

## Out Of Scope

```txt
member post/event UI
admin post/event UI
Markdown sanitization beyond simple text-safe rendering
pagination
search
RSS/ICS feeds
```

### Task 1: Add Public Feed Repository Methods

- [x] Add public post list query.
- [x] Add public event list query.
- [x] Return only published rows with `is_public = true`.
- [x] Limit the number of returned rows.
- [x] Cover SQL behavior with focused repository tests.

### Task 2: Add Public API Routes

- [x] Implement `GET /api/public/posts`.
- [x] Implement `GET /api/public/events`.
- [x] Return stable response shapes.
- [x] Keep routes unauthenticated.
- [x] Add route tests proving drafts, deleted, and member-only rows are excluded at repository level.

### Task 3: Add Web API Helper

- [x] Add a small web data helper for public posts/events.
- [x] Read the API base URL from SST-linked resources or a build/runtime-safe fallback.
- [x] Return empty arrays if the API fetch fails so the landing page remains renderable.
- [x] Add helper tests where practical.

### Task 4: Connect The Landing Page

- [x] Update `packages/web/src/pages/[locale]/index.astro`.
- [x] Render API-backed public posts.
- [x] Render API-backed public events.
- [x] Preserve Catalan, Spanish, and English localized empty labels.
- [x] Avoid client-only loading for the first version.

### Task 5: Deploy And Record

- [x] Run package tests and typechecks.
- [x] Deploy dev.
- [x] Create temporary public and member-only post/event rows for live checks.
- [x] Live-check public API routes and localized landing page output.
- [x] Clean up temporary live-check data.
- [x] Update design docs, implementation log, and roadmap.
