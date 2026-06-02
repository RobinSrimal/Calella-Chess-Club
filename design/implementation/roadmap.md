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
001-cloudflare-d1-resource
```

Goal: replace the active AWS scaffold resources with exactly one Cloudflare D1 resource managed by SST.

Detailed plan:

```txt
design/implementation/slices/001-cloudflare-d1-resource.md
```

## Future Slices

Future slices are intentionally high-level until the previous slice has been completed and reviewed.

```txt
002-db-package-and-empty-migration
  Create packages/db structure and the first migration file without applying full app schema yet.

003-auth-worker-health
  Add packages/functions/src/auth.ts as a Cloudflare Worker with a health route and no password logic.

004-api-worker-health
  Add packages/functions/src/api.ts as a Cloudflare Worker with a health route and access-JWT parsing left out.

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
