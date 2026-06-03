# Posts Drafts Publish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement member post drafts, publishing, editing, soft delete, and admin public visibility.

**Architecture:** Api owns post routes. Post access is based on a valid access JWT plus current user state loaded from D1. Approved members and admins can create and publish their own posts. Admins can toggle public visibility on published posts, but cannot edit another user's content or see another user's drafts.

**Tech Stack:** Cloudflare Workers, D1, SST-linked JwtSigningSecret, simple Markdown text storage, stable JSON error codes.

---

## API Scope

```txt
GET /api/posts
  returns published member-visible posts plus the current user's own drafts

POST /api/posts
  creates a draft
  default status = draft
  default is_public = false

GET /api/posts/:id
  returns own draft, own published post, or published member-visible post

PUT /api/posts/:id
  edits the caller's own non-deleted post
  preserves draft/published status
  does not change public visibility

POST /api/posts/:id/publish
  publishes the caller's own draft
  default is_public = false
  admin may explicitly request immediate public visibility
  non-admin immediate-public requests are rejected

POST /api/posts/:id/public
  admin only
  marks a published post public

POST /api/posts/:id/member-only
  admin only
  marks a published post member-only

DELETE /api/posts/:id
  soft deletes the caller's own post or an admin-visible published post
```

## Data Scope

```txt
posts
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

```txt
drafts are visible only to the creator
new posts always start as draft
new posts always default to is_public = false, including admin-authored posts
published posts are visible to approved members and admins
public posts are published posts with is_public = true
deletes are soft deletes
admins can toggle public visibility on published posts
admins cannot edit member-authored content
admins cannot see another user's drafts
```

## Stable Error Codes

```txt
API_AUTH_REQUIRED
API_AUTH_INVALID
API_FORBIDDEN
API_POST_NOT_FOUND
API_VALIDATION_FAILED
API_ROUTE_NOT_FOUND
```

## Out Of Scope

```txt
frontend post screens
public landing page feeds
events
uploads
audit_events table
email notifications
full Markdown rendering
```

### Task 1: Add Posts Migration And Schema Metadata

- [ ] Add `packages/db/migrations/0004_posts.sql`.
- [ ] Add posts schema metadata in `packages/db/src/schema.ts`.
- [ ] Include a foreign key from `posts.author_id` to `users.id`.
- [ ] Include a foreign key from `posts.deleted_by` to `users.id`.
- [ ] Add useful indexes for author drafts, published posts, and public posts.
- [ ] Cover schema metadata with db tests.

### Task 2: Add Post Validation Helpers

- [ ] Add title validation.
- [ ] Add body Markdown validation.
- [ ] Keep Markdown as text storage in this slice.
- [ ] Reject empty or oversized payloads with stable field errors.
- [ ] Add focused validation tests.

### Task 3: Add Post Repository Methods

- [ ] Add row mapping helpers.
- [ ] Add list query for published member-visible posts plus own drafts.
- [ ] Add create draft method.
- [ ] Add find-visible method for route access checks.
- [ ] Add owner edit method.
- [ ] Add publish method.
- [ ] Add admin visibility toggle methods.
- [ ] Add soft-delete method.
- [ ] Cover SQL behavior with focused repository tests.

### Task 4: Add Member/Admin Route Guards

- [ ] Load current user from D1 for post routes.
- [ ] Require active, verified users.
- [ ] Require `membership_status = member` or `role = admin`.
- [ ] Reuse admin guard for public visibility routes.
- [ ] Add guard tests for missing token, invalid token, pending user, rejected user, disabled user, member, and admin.

### Task 5: Implement Draft CRUD Routes

- [ ] Implement `GET /api/posts`.
- [ ] Implement `POST /api/posts`.
- [ ] Implement `GET /api/posts/:id`.
- [ ] Implement `PUT /api/posts/:id`.
- [ ] Reject non-visible or deleted posts with `API_POST_NOT_FOUND`.
- [ ] Add route tests.

### Task 6: Implement Publish And Visibility Routes

- [ ] Implement `POST /api/posts/:id/publish`.
- [ ] Keep published posts member-only by default.
- [ ] Allow admin-authored publish requests to explicitly set public visibility.
- [ ] Reject immediate-public publish requests from non-admin users.
- [ ] Implement `POST /api/posts/:id/public`.
- [ ] Implement `POST /api/posts/:id/member-only`.
- [ ] Add route tests.

### Task 7: Implement Soft Delete

- [ ] Implement `DELETE /api/posts/:id`.
- [ ] Allow owners to soft-delete their own posts.
- [ ] Allow admins to soft-delete published posts.
- [ ] Set `status = deleted`, `deleted_at`, `deleted_by`, and `updated_at`.
- [ ] Add route tests.

### Task 8: Deploy And Record

- [ ] Run package tests and typechecks.
- [ ] Apply the posts migration to dev D1.
- [ ] Deploy dev.
- [ ] Live-check draft create, publish, admin public toggle, and soft delete with temporary data.
- [ ] Clean up temporary live-check data.
- [ ] Update design docs, implementation log, and roadmap.
