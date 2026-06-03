# Admin Users UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first functional admin user-management screen so admins can review membership requests and disable accounts from the website.

**Architecture:** The website stays Astro-first. The `/[locale]/admin/users` page mounts a React island that checks `/api/me`, requires the current user to be an admin, loads users through same-origin `/api/admin/users`, and performs admin actions through the existing API routes. The backend remains authoritative for admin authorization and membership/account changes.

**Tech Stack:** Astro, React islands, Cloudflare Worker same-origin proxy routes, existing Api Worker admin routes, TypeScript, Vitest.

---

## Context

Slice 008 implemented the backend admin user routes and first-admin promotion script. Frontend admin screens were explicitly out of scope for that slice.

The current admin pages are route shells only. This slice connects the admin users page to the existing admin user APIs. It does not add role management, content moderation, public visibility toggles, email notifications, or user deletion.

## File Structure

```txt
packages/web/src/lib/browser-api.ts
packages/web/src/lib/browser-api.test.ts

packages/web/src/components/admin/AdminUsersPanel.tsx
packages/web/src/components/admin/admin-users-state.ts
packages/web/src/components/admin/admin-users-state.test.ts

packages/web/src/pages/[locale]/admin/users.astro
packages/web/src/i18n/ca.ts
packages/web/src/i18n/es.ts
packages/web/src/i18n/en.ts
packages/web/src/i18n/translations.test.ts
packages/web/src/styles/global.css

design/packages/web/astro-structure.md
design/packages/web/overview.md
design/implementation/log.md
design/implementation/roadmap.md
```

## Scope

```txt
add browser API helpers for admin user list and actions
add admin-user UI state helpers and English-only stable error messages
add localized Catalan, Spanish, and English labels for the admin users screen
hydrate /{locale}/admin/users with an admin users React island
show loading, login-required, forbidden, empty, success, and error states
support filters matching the backend list query
support approve membership, reject membership, restore membership, and disable account actions
prevent accidental self-disable in the UI
verify locally, deploy dev, and smoke-test through the Web origin
```

## Out Of Scope

```txt
admin posts UI
admin events UI
public/member-only content visibility toggles
role promotion or demotion in the website UI
user deletion
account re-enable route
email notifications for approval, rejection, or disablement
bulk actions
audit event table
password reset or support tooling
```

## UI Rules

```txt
The page loads through /{locale}/admin/users.
The island calls GET /api/me before showing admin controls.
Only users with role=admin can load and use the admin users panel.
The backend remains the final check for active and verified admin state.
Non-admin users see an informational forbidden state.
The panel lists users returned by GET /api/admin/users.
Rejected membership keeps the account active.
Disable is an account action, not membership rejection.
Disabled accounts remain listed but cannot log in.
The UI must not offer user deletion.
The UI must not offer role changes.
The UI must not offer disable for the current signed-in admin.
Membership actions are hidden for disabled accounts.
Stable API error-code messages stay English-only.
Labels and static UI chrome use the selected locale.
```

## API Contract

### Existing Routes

```txt
GET /api/admin/users
  query: membershipStatus? role? accountStatus?
  success: 200 { "users": AdminUserSummary[] }

POST /api/admin/users/:id/approve-membership
  body: {}
  success: 200 { "user": AdminUserSummary }
  changes membership_status to member

POST /api/admin/users/:id/reject-membership
  body: {}
  success: 200 { "user": AdminUserSummary }
  changes membership_status to rejected
  account remains active

POST /api/admin/users/:id/restore-membership
  body: {}
  success: 200 { "user": AdminUserSummary }
  changes membership_status to pending

POST /api/admin/users/:id/disable
  body: {}
  success: 200 { "user": AdminUserSummary }
  changes account_status to disabled
  sets disabled_at and disabled_by
  revokes active refresh sessions
```

All unsafe browser calls through the Astro Web proxy must send `content-type: application/json` and a JSON body. For actions without payload, send `{}`. This matches the post-delete proxy finding from slice 014 and avoids Astro treating bodyless unsafe requests as cross-site form submissions.

### Admin User Summary

```ts
export type AccountStatus = "active" | "disabled";
export type MembershipStatus = "none" | "pending" | "member" | "rejected";
export type UserRole = "user" | "admin";

export type AdminUserSummary = {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  membershipStatus: MembershipStatus;
  role: UserRole;
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
  disabledAt: string | null;
  disabledBy: string | null;
};
```

### Browser API Helpers

```ts
type AdminUserFilters = {
  membershipStatus?: MembershipStatus;
  role?: UserRole;
  accountStatus?: AccountStatus;
};

listAdminUsers(filters?: AdminUserFilters): Promise<ApiResult<{ users: AdminUserSummary[] }>>;
approveMembership(userId: string): Promise<ApiResult<{ user: AdminUserSummary }>>;
rejectMembership(userId: string): Promise<ApiResult<{ user: AdminUserSummary }>>;
restoreMembership(userId: string): Promise<ApiResult<{ user: AdminUserSummary }>>;
disableUser(userId: string): Promise<ApiResult<{ user: AdminUserSummary }>>;
```

## Tasks

### Task 1: Add Browser Admin User API Helpers

**Files:**

```txt
Modify: packages/web/src/lib/browser-api.ts
Modify: packages/web/src/lib/browser-api.test.ts
```

- [ ] Add `AccountStatus`, `AdminUserSummary`, and `AdminUserFilters` types.
- [ ] Add `listAdminUsers` with optional `membershipStatus`, `role`, and `accountStatus` query params.
- [ ] Add `approveMembership`, `rejectMembership`, `restoreMembership`, and `disableUser`.
- [ ] Ensure every request uses `credentials: "same-origin"`.
- [ ] Ensure every admin action POST sends `content-type: application/json` with body `{}`.
- [ ] Test paths, query params, methods, credentials, JSON bodies, stable error normalization, and fetch failure.
- [ ] Run `npx vitest --run packages/web/src/lib/browser-api.test.ts`.

### Task 2: Add Admin User UI State Helpers

**Files:**

```txt
Create: packages/web/src/components/admin/admin-users-state.ts
Create: packages/web/src/components/admin/admin-users-state.test.ts
```

- [ ] Add sort helper that puts active pending requests first, then active non-members, active members/admins, and disabled users last.
- [ ] Add action helper for approve, reject, restore, and disable visibility.
- [ ] Hide membership actions for disabled users.
- [ ] Hide disable action for the current signed-in admin.
- [ ] Add `messageForAdminUserErrorCode(code)` with English-only stable API error-code messages.
- [ ] Test sorting, action visibility, self-disable prevention, and error-code messages.
- [ ] Run `npx vitest --run packages/web/src/components/admin/admin-users-state.test.ts`.

### Task 3: Add Admin User Translations

**Files:**

```txt
Modify: packages/web/src/i18n/ca.ts
Modify: packages/web/src/i18n/es.ts
Modify: packages/web/src/i18n/en.ts
Modify: packages/web/src/i18n/translations.test.ts
```

- [ ] Add localized labels for loading, empty list, filters, status badges, role badges, approve, reject, restore, disable, disabled account, current admin, success messages, login required, and forbidden state.
- [ ] Keep API error-code messages English-only in the state helper.
- [ ] Keep Catalan as the primary UX language.
- [ ] Run `npx vitest --run packages/web/src/i18n/translations.test.ts`.

### Task 4: Add Admin Users Panel

**Files:**

```txt
Create: packages/web/src/components/admin/AdminUsersPanel.tsx
Modify: packages/web/src/styles/global.css
```

- [ ] On mount, call `getCurrentUser`.
- [ ] Show login-required state for `API_AUTH_REQUIRED` or `API_AUTH_INVALID`.
- [ ] Show forbidden state when the current user is not an admin.
- [ ] Load admin users with `listAdminUsers`.
- [ ] Render a dense, scannable admin table or list with username, email, email verification, membership status, role, account status, created date, and actions.
- [ ] Add filters for membership status, role, and account status.
- [ ] Implement approve, reject, restore, and disable actions with per-row pending state.
- [ ] Replace the changed row from the action response without forcing a full reload.
- [ ] Show success and error messages without optimistic destructive changes.
- [ ] Keep layout usable on mobile with stacked rows or horizontally safe controls.

### Task 5: Wire The Admin Users Page

**Files:**

```txt
Modify: packages/web/src/pages/[locale]/admin/users.astro
Modify: design/packages/web/astro-structure.md
Modify: design/packages/web/overview.md
```

- [ ] Import `AdminUsersPanel`.
- [ ] Pass localized labels from Astro to the React island.
- [ ] Hydrate with `client:load` because admin actions are the page's primary workflow.
- [ ] Keep `AdminLayout` and localized page intro.
- [ ] Update web design docs to list the new admin island.

### Task 6: Verify, Deploy, And Record

**Files:**

```txt
Modify: design/implementation/log.md
Modify: design/implementation/roadmap.md
```

- [ ] Run `npm test --workspace packages/web`.
- [ ] Run `npx tsc --noEmit -p packages/web/tsconfig.json`.
- [ ] Run `npm run build --workspace packages/web`.
- [ ] Deploy dev with `npx sst deploy --stage dev`.
- [ ] Live-smoke through the Web origin as an admin.
- [ ] Confirm a pending user can be approved.
- [ ] Confirm a pending user can be rejected and remains an active user.
- [ ] Confirm a rejected user can be restored to pending.
- [ ] Confirm a user can be disabled and cannot log in afterward.
- [ ] Confirm the UI does not offer delete or role-management actions.
- [ ] Clean up temporary live-smoke users and sessions.
- [ ] Update the implementation log with commits, verification, deployment, and live-smoke results.
- [ ] Move the roadmap to the next slice.
