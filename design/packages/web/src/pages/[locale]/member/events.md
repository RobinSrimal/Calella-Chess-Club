# Route: /[locale]/member/events

## Intended File

```txt
packages/web/src/pages/[locale]/member/events.astro
```

## Purpose

Member calendar/event list and authoring entry point.

## Features

```txt
view published member events
view own drafts
create draft
edit own draft or published event
publish own draft
soft-delete own event
```

Events are informational only in version 1: no recurrence and no RSVP.

When the current user is an admin, the publish flow includes an unchecked "make public immediately" control. If left unchecked, the event is published for members only. Non-admin users never see this control.
