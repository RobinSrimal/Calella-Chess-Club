# Implementation Roadmap

## Purpose

This roadmap keeps the overall direction visible while limiting detailed planning to the next executable slice. After each slice, update `design/implementation/log.md` with what changed, which commit recorded it, what was verified, and what decisions changed.

## Planning Rules

```txt
keep the roadmap high-level
write detailed steps only for the next slice
keep each slice small enough to review and correct
commit implementation separately from design-plan updates when useful
update the log after every completed slice
```

## Current Slice

```txt
004-api-worker-health
```

Goal: add `packages/functions/src/api.ts` as a Cloudflare Worker with a health route and access-JWT parsing left out.

Detailed plan:

```txt
design/implementation/slices/004-api-worker-health.md
```

## Future Slices

Future slices are intentionally high-level until the previous slice has been completed and reviewed.

```txt
005-web-astro-shell
  Add packages/web Astro shell with locale routing and static route shells for public, auth, member, and admin pages.

006-auth-registration-email-verification
  Implement user registration, bcrypt-compatible hashing, email verification token storage, and Resend integration.

007-login-refresh-logout-me
  Implement login, access JWT cookies, refresh cookies, logout, and /api/me.

008-membership-admin-users
  Implement admin membership approval, rejection, restore, and account disablement.

009-posts-drafts-publish
  Implement member post drafts, publishing, editing, soft delete, and admin public visibility.

010-events-drafts-publish
  Implement member event drafts, publishing, editing, soft delete, and admin public visibility.

011-public-landing-data
  Connect public landing page feeds to public posts and events.
```
