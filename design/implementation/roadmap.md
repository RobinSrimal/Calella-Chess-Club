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
008-membership-admin-users
```

Goal: implement first-admin promotion, admin user listing, membership approval/rejection/restore, and account disablement.

Detailed plan:

```txt
design/implementation/slices/008-membership-admin-users.md
```

## Future Slices

Future slices are intentionally high-level until the previous slice has been completed and reviewed.

```txt
009-posts-drafts-publish
  Implement member post drafts, publishing, editing, soft delete, and admin public visibility.

010-events-drafts-publish
  Implement member event drafts, publishing, editing, soft delete, and admin public visibility.

011-public-landing-data
  Connect public landing page feeds to public posts and events.
```
