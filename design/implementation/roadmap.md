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
011-public-landing-data
```

Goal: expose public post/event feeds and connect the localized landing page to public data.

Detailed plan:

```txt
design/implementation/slices/011-public-landing-data.md
```

## Future Slices

Future slices are intentionally high-level until the previous slice has been completed and reviewed.

```txt
012-member-content-ui
  Connect member post/event screens to the authenticated APIs.

013-admin-content-ui
  Connect admin user/content screens to the admin APIs.
```
