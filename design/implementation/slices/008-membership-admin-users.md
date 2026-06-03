# Membership Admin Users Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement first-admin promotion, admin user listing, membership approval/rejection/restore, and account disablement.

**Architecture:** Api owns admin user routes. Admin routes verify the access JWT, load the current user from D1, and require `role = admin`, `account_status = active`, and verified email. A scripts package command promotes the first admin without exposing a public setup route.

**Tech Stack:** Cloudflare Workers, D1, SST-linked JwtSigningSecret, TypeScript scripts, stable JSON error codes.

---

## API Scope

```txt
GET /api/admin/users
  query: membershipStatus? role? accountStatus?
  success: 200 { "users": AdminUserSummary[] }

POST /api/admin/users/:id/approve-membership
  success: 200 { "user": AdminUserSummary }
  changes membership_status to member

POST /api/admin/users/:id/reject-membership
  success: 200 { "user": AdminUserSummary }
  changes membership_status to rejected
  account remains active

POST /api/admin/users/:id/restore-membership
  success: 200 { "user": AdminUserSummary }
  changes rejected membership back to pending

POST /api/admin/users/:id/disable
  success: 200 { "user": AdminUserSummary }
  changes account_status to disabled
  sets disabled_at and disabled_by
  revokes active refresh sessions
```

## Script Scope

```txt
packages/scripts/src/promote-first-admin.ts
  input: username or email
  checks exactly one matching verified active user
  sets role = admin
```

## Stable Error Codes

```txt
API_AUTH_REQUIRED
API_AUTH_INVALID
API_FORBIDDEN
API_USER_NOT_FOUND
API_VALIDATION_FAILED
API_ROUTE_NOT_FOUND
SCRIPT_USER_NOT_FOUND
SCRIPT_USER_NOT_VERIFIED
SCRIPT_USER_DISABLED
```

## Out Of Scope

```txt
frontend admin screens
audit_events table
email notifications for approval/rejection
role management beyond first-admin promotion
bulk actions
```

### Task 1: Add Admin User Repository Methods

- [x] Add public/admin user row mapping helpers.
- [x] Add current-user lookup with account status and email verification state.
- [x] Add admin user list query with conservative filters.
- [x] Add membership status update methods.
- [x] Add account disable method that revokes refresh sessions.
- [x] Cover repository SQL behavior with focused tests where practical.

### Task 2: Add API Admin Auth Guard

- [x] Reuse access JWT cookie verification.
- [x] Load current user from D1.
- [x] Require active, verified, admin users.
- [x] Return stable API auth/forbidden errors.
- [x] Add tests for missing token, invalid token, non-admin user, and disabled admin.

### Task 3: Implement Admin User List

- [x] Implement `GET /api/admin/users`.
- [x] Support `membershipStatus`, `role`, and `accountStatus` filters.
- [x] Return stable admin user summaries.
- [x] Add route tests.

### Task 4: Implement Membership Decisions

- [x] Implement approve membership.
- [x] Implement reject membership without disabling the account.
- [x] Implement restore membership to pending.
- [x] Reject unknown users with `API_USER_NOT_FOUND`.
- [x] Add route tests for each transition.

### Task 5: Implement Account Disablement

- [x] Implement disable route.
- [x] Set `account_status = disabled`, `disabled_at`, and `disabled_by`.
- [x] Revoke active refresh sessions for the disabled user.
- [x] Add tests proving disabled users cannot log in after the change.

### Task 6: Implement First Admin Promotion Script

- [x] Add `packages/scripts/src/promote-first-admin.ts`.
- [x] Accept username/email input.
- [x] Promote exactly one active, verified user to admin.
- [x] Return stable script errors for missing, unverified, or disabled users.
- [x] Add script tests or a dry-run unit around the repository logic.

### Task 7: Deploy And Record

- [x] Run package tests and typechecks.
- [x] Deploy dev.
- [x] Promote a dev admin user for live checks, then clean up any temporary data.
- [x] Live-check admin list and membership transitions.
- [x] Update design docs, implementation log, and roadmap.

## Completion Notes

The API routes were deployed to the dev stage and live-checked with temporary D1 users. The first-admin script runs through `sst shell`, but it uses the Cloudflare D1 HTTP API because `Resource.Database` exposes metadata rather than a D1 binding in that local script runtime.

Temporary live-check users, sessions, and login attempts were cleaned up. The audit event table remains out of scope for this slice.
