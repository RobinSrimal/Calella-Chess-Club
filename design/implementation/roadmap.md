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
018-reactweb-member-posts-blocknote-ui
```

Goal: add the ReactWeb member posts workflow with a separate title field and restricted BlockNote body editor.

Detailed plan:

```txt
design/implementation/slices/018-reactweb-member-posts-blocknote-ui.md
```

## Future Slices

Future slices are intentionally high-level until the previous slice has been completed and reviewed.

```txt
019-reactweb-events-ui
  Add ReactWeb member event/calendar UI.

020-password-reset-backend-ui
  Add backend forgot/reset password endpoints and replace the informational ReactWeb password pages with functional forms.
```
