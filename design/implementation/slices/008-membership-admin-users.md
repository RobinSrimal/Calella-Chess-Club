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

- [ ] Add public/admin user row mapping helpers.
- [ ] Add current-user lookup with account status and email verification state.
- [ ] Add admin user list query with conservative filters.
- [ ] Add membership status update methods.
- [ ] Add account disable method that revokes refresh sessions.
- [ ] Cover repository SQL behavior with focused tests where practical.

### Task 2: Add API Admin Auth Guard

- [ ] Reuse access JWT cookie verification.
- [ ] Load current user from D1.
- [ ] Require active, verified, admin users.
- [ ] Return stable API auth/forbidden errors.
- [ ] Add tests for missing token, invalid token, non-admin user, and disabled admin.

### Task 3: Implement Admin User List

- [ ] Implement `GET /api/admin/users`.
- [ ] Support `membershipStatus`, `role`, and `accountStatus` filters.
- [ ] Return stable admin user summaries.
- [ ] Add route tests.

### Task 4: Implement Membership Decisions

- [ ] Implement approve membership.
- [ ] Implement reject membership without disabling the account.
- [ ] Implement restore membership to pending.
- [ ] Reject unknown users with `API_USER_NOT_FOUND`.
- [ ] Add route tests for each transition.

### Task 5: Implement Account Disablement

- [ ] Implement disable route.
- [ ] Set `account_status = disabled`, `disabled_at`, and `disabled_by`.
- [ ] Revoke active refresh sessions for the disabled user.
- [ ] Add tests proving disabled users cannot log in after the change.

### Task 6: Implement First Admin Promotion Script

- [ ] Add `packages/scripts/src/promote-first-admin.ts`.
- [ ] Accept username/email input.
- [ ] Promote exactly one active, verified user to admin.
- [ ] Return stable script errors for missing, unverified, or disabled users.
- [ ] Add script tests or a dry-run unit around the repository logic.

### Task 7: Deploy And Record

- [ ] Run package tests and typechecks.
- [ ] Deploy dev.
- [ ] Promote a dev admin user for live checks, then clean up any temporary data.
- [ ] Live-check admin list and membership transitions.
- [ ] Update design docs, implementation log, and roadmap.
