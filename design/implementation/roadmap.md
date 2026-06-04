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
016-react-router-web-shell
```

Goal: add a parallel React Router web package on Cloudflare with TypeScript, Tailwind, localized shell routes, and same-origin backend proxy routes.

Detailed plan:

```txt
design/implementation/slices/016-react-router-web-shell.md
```

## Future Slices

Future slices are intentionally high-level until the previous slice has been completed and reviewed.

```txt
017-member-events-ui
  Connect member event list/create/edit/publish/delete UI to the existing event APIs.

018-admin-content-ui
  Connect admin post/event content screens to public/member-only visibility toggles and delete actions.
```
