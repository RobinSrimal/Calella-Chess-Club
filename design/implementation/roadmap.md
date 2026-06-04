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
017-reactweb-account-admin-gaps
```

Goal: close the non-post/event ReactWeb UI gaps left after the Astro removal: email verification, password utility routes, and admin user management.

Detailed plan:

```txt
design/implementation/slices/017-reactweb-account-admin-gaps.md
```

## Future Slices

Future slices are intentionally high-level until the previous slice has been completed and reviewed.

```txt
018-reactweb-posts-events-ui
  Add ReactWeb member posts/events UI and admin post/event content screens.
```
