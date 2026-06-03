# Member Content UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect member post and event screens to the authenticated APIs through the website origin.

**Architecture:** The Web worker already proxies `/api/*` to the App API Worker, so member UI should call same-origin browser API helpers with `credentials: "same-origin"`. React islands should own interactive post/event list, draft, edit, publish, and delete workflows. Astro pages should keep routing, layout, and translated chrome.

**Tech Stack:** Astro, React islands, TypeScript, same-origin Web `/api/*` proxy, App API post/event routes.

---

## Scope

```txt
member post list
member post draft editor
member post publish/member-only behavior
member event list
member event draft editor
member event publish/member-only behavior
simple success/error states
English-only stable error-code messages
```

## Out Of Scope

```txt
admin moderation UI
landing-page public visibility controls
rich Markdown preview
calendar grid UI
file uploads
```

### Task 1: Add Browser Post/Event API Helpers

- [ ] Add typed helpers for `GET/POST/PUT/DELETE /api/posts`.
- [ ] Add typed helpers for post publish.
- [ ] Add typed helpers for `GET/POST/PUT/DELETE /api/events`.
- [ ] Add typed helpers for event publish.
- [ ] Cover request shapes and stable error parsing with tests.

### Task 2: Add Member Post UI

- [ ] Replace the static member posts page panel with a React island.
- [ ] List posts visible to the current member.
- [ ] Create and edit draft posts.
- [ ] Publish drafts as member-only by default.
- [ ] Delete own posts.
- [ ] Keep public-visibility toggles out of the member workflow.

### Task 3: Add Member Event UI

- [ ] Replace the static member events page panel with a React island.
- [ ] List events visible to the current member.
- [ ] Create and edit draft events.
- [ ] Publish drafts as member-only by default.
- [ ] Delete own events.
- [ ] Validate start/end fields before submitting.

### Task 4: Verify And Deploy

- [ ] Run web tests and typecheck.
- [ ] Run functions tests and typecheck.
- [ ] Run Astro build.
- [ ] Deploy `dev`.
- [ ] Live-check member post and event workflows with a temporary verified member user.
- [ ] Clean up temporary live-check data.
- [ ] Update docs, implementation log, and roadmap.
