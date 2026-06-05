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
021-reactweb-component-and-backend-test-coverage
```

Goal: add a practical Vitest-based testing foundation for rendered React components and fill targeted backend session/error coverage gaps.

Detailed plan:

```txt
design/implementation/slices/021-reactweb-component-and-backend-test-coverage.md
```

## Future Slices

Future slices are intentionally high-level until the previous slice has been completed and reviewed.

```txt
022-password-reset-backend-ui
  Add backend forgot/reset password endpoints and replace the informational ReactWeb password pages with functional forms.

admin-post-approval-ui
  Add ReactWeb admin screens for reviewing posts and controlling landing-page visibility.
```
