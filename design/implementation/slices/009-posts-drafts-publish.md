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

- [x] Add `packages/db/migrations/0004_posts.sql`.
- [x] Add posts schema metadata in `packages/db/src/schema.ts`.
- [x] Include a foreign key from `posts.author_id` to `users.id`.
- [x] Include a foreign key from `posts.deleted_by` to `users.id`.
- [x] Add useful indexes for author drafts, published posts, and public posts.
- [x] Cover schema metadata with db tests.

### Task 2: Add Post Validation Helpers

- [x] Add title validation.
- [x] Add body Markdown validation.
- [x] Keep Markdown as text storage in this slice.
- [x] Reject empty or oversized payloads with stable field errors.
- [x] Add focused validation tests.

### Task 3: Add Post Repository Methods

- [x] Add row mapping helpers.
- [x] Add list query for published member-visible posts plus own drafts.
- [x] Add create draft method.
- [x] Add find-visible method for route access checks.
- [x] Add owner edit method.
- [x] Add publish method.
- [x] Add admin visibility toggle methods.
- [x] Add soft-delete method.
- [x] Cover SQL behavior with focused repository tests.

### Task 4: Add Member/Admin Route Guards

- [x] Load current user from D1 for post routes.
- [x] Require active, verified users.
- [x] Require `membership_status = member` or `role = admin`.
- [x] Reuse admin guard for public visibility routes.
- [x] Add guard tests for missing token, invalid token, pending user, rejected user, disabled user, member, and admin.

### Task 5: Implement Draft CRUD Routes

- [x] Implement `GET /api/posts`.
- [x] Implement `POST /api/posts`.
- [x] Implement `GET /api/posts/:id`.
- [x] Implement `PUT /api/posts/:id`.
- [x] Reject non-visible or deleted posts with `API_POST_NOT_FOUND`.
- [x] Add route tests.

### Task 6: Implement Publish And Visibility Routes

- [x] Implement `POST /api/posts/:id/publish`.
- [x] Keep published posts member-only by default.
- [x] Allow admin-authored publish requests to explicitly set public visibility.
- [x] Reject immediate-public publish requests from non-admin users.
- [x] Implement `POST /api/posts/:id/public`.
- [x] Implement `POST /api/posts/:id/member-only`.
- [x] Add route tests.

### Task 7: Implement Soft Delete

- [x] Implement `DELETE /api/posts/:id`.
- [x] Allow owners to soft-delete their own posts.
- [x] Allow admins to soft-delete published posts.
- [x] Set `status = deleted`, `deleted_at`, `deleted_by`, and `updated_at`.
- [x] Add route tests.

### Task 8: Deploy And Record

- [x] Run package tests and typechecks.
- [x] Apply the posts migration to dev D1.
- [x] Deploy dev.
- [x] Live-check draft create, publish, admin public toggle, and soft delete with temporary data.
- [x] Clean up temporary live-check data.
- [x] Update design docs, implementation log, and roadmap.

## Completion Notes

The posts API was deployed to the dev stage and live-checked with temporary D1 users. New posts start as drafts and member-only. Member attempts to publish directly as public are rejected with `API_FORBIDDEN`. Admins can toggle published posts public/member-only and soft-delete published posts.

Temporary live-check users and posts were removed after verification. Frontend post screens and public landing feeds remain out of scope.
