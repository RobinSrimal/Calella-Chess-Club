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
012-web-auth-forms-and-proxy
```

Goal: make browser auth work from the website with same-origin proxy routes and functional login/register forms.

Detailed plan:

```txt
design/implementation/slices/012-web-auth-forms-and-proxy.md
```

## Future Slices

Future slices are intentionally high-level until the previous slice has been completed and reviewed.

```txt
013-member-content-ui
  Connect member post/event screens to the authenticated APIs.

014-admin-content-ui
  Connect admin user/content screens to the admin APIs.
```
