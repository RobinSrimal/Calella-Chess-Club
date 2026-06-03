# Events Drafts Publish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement member event drafts, publishing, editing, soft delete, and admin public visibility.

**Architecture:** Api owns event routes. Event access is based on a valid access JWT plus current user state loaded from D1. Approved members and admins can create and publish their own events. Admins can toggle public visibility on published events, but cannot edit another user's content or see another user's drafts.

**Tech Stack:** Cloudflare Workers, D1, SST-linked JwtSigningSecret, simple Markdown text storage, stable JSON error codes.

---

## API Scope

```txt
GET /api/events
  returns published member-visible events plus the current user's own drafts

POST /api/events
  creates a draft
  default status = draft
  default is_public = false

GET /api/events/:id
  returns own draft, own published event, or published member-visible event

PUT /api/events/:id
  edits the caller's own non-deleted event
  preserves draft/published status
  does not change public visibility

POST /api/events/:id/publish
  publishes the caller's own draft
  default is_public = false
  admin may explicitly request immediate public visibility
  non-admin immediate-public requests are rejected

POST /api/events/:id/public
  admin only
  marks a published event public

POST /api/events/:id/member-only
  admin only
  marks a published event member-only

DELETE /api/events/:id
  soft deletes the caller's own event or an admin-visible published event
```

## Data Scope

```txt
events
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

```txt
events are informational only
no recurrence
no RSVP
drafts are visible only to the creator
new events always start as draft
new events always default to is_public = false, including admin-authored events
published events are visible to approved members and admins
public events are published events with is_public = true
deletes are soft deletes
admins can toggle public visibility on published events
admins cannot edit member-authored content
admins cannot see another user's drafts
```

## Validation

```txt
title: required, 1-120 trimmed characters
descriptionMarkdown: required, 1-10000 trimmed characters
location: optional, max 200 trimmed characters
startsAt: required ISO date-time string
endsAt: required ISO date-time string after startsAt
```

## Stable Error Codes

```txt
API_AUTH_REQUIRED
API_AUTH_INVALID
API_FORBIDDEN
API_EVENT_NOT_FOUND
API_VALIDATION_FAILED
API_ROUTE_NOT_FOUND
```

## Out Of Scope

```txt
frontend event screens
public landing page feeds
posts changes
recurrence
RSVPs
uploads
audit_events table
email notifications
full Markdown rendering
```

### Task 1: Add Events Migration And Schema Metadata

- [ ] Add `packages/db/migrations/0005_events.sql`.
- [ ] Add events schema metadata in `packages/db/src/schema.ts`.
- [ ] Include a foreign key from `events.author_id` to `users.id`.
- [ ] Include a foreign key from `events.deleted_by` to `users.id`.
- [ ] Add useful indexes for author drafts, published calendar ranges, and public event feeds.
- [ ] Cover schema metadata with db tests.

### Task 2: Add Event Validation Helpers

- [ ] Add title validation.
- [ ] Add description Markdown validation.
- [ ] Add optional location validation.
- [ ] Add start/end date-time validation.
- [ ] Reject empty, oversized, invalid date, or end-before-start payloads with stable field errors.
- [ ] Add focused validation tests.

### Task 3: Add Event Repository Methods

- [ ] Add row mapping helpers.
- [ ] Add list query for published member-visible events plus own drafts.
- [ ] Add create draft method.
- [ ] Add find-visible method for route access checks.
- [ ] Add owner edit method.
- [ ] Add publish method.
- [ ] Add admin visibility toggle methods.
- [ ] Add soft-delete method.
- [ ] Cover SQL behavior with focused repository tests.

### Task 4: Add Event Routes

- [ ] Reuse member/admin current-user guard.
- [ ] Implement `GET /api/events`.
- [ ] Implement `POST /api/events`.
- [ ] Implement `GET /api/events/:id`.
- [ ] Implement `PUT /api/events/:id`.
- [ ] Reject non-visible or deleted events with `API_EVENT_NOT_FOUND`.
- [ ] Add route tests.

### Task 5: Implement Publish And Visibility Routes

- [ ] Implement `POST /api/events/:id/publish`.
- [ ] Keep published events member-only by default.
- [ ] Allow admin-authored publish requests to explicitly set public visibility.
- [ ] Reject immediate-public publish requests from non-admin users.
- [ ] Implement `POST /api/events/:id/public`.
- [ ] Implement `POST /api/events/:id/member-only`.
- [ ] Add route tests.

### Task 6: Implement Soft Delete

- [ ] Implement `DELETE /api/events/:id`.
- [ ] Allow owners to soft-delete their own events.
- [ ] Allow admins to soft-delete published events.
- [ ] Set `status = deleted`, `deleted_at`, `deleted_by`, and `updated_at`.
- [ ] Add route tests.

### Task 7: Deploy And Record

- [ ] Run package tests and typechecks.
- [ ] Apply the events migration to dev D1.
- [ ] Deploy dev.
- [ ] Live-check draft create, publish, admin public toggle, and soft delete with temporary data.
- [ ] Clean up temporary live-check data.
- [ ] Update design docs, implementation log, and roadmap.
