# ReactWeb Landing And Auth Navigation Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up the ReactWeb public landing page and top navigation so the site reads like a chess club website and responds correctly to logged-in member/admin state.

**Architecture:** Keep `packages/web-react` as the active website package and reuse the existing same-origin proxy routes. Add a small auth-aware navigation layer that checks `/api/me` client-side and drives a shared header. Keep the landing page public and render public post placeholders through the existing unauthenticated `/api/public/posts` feed.

**Tech Stack:** React Router v7 framework mode, React 19, TypeScript, Tailwind CSS v4, existing Api/Auth Worker proxy routes, Vitest, SST dev deployment.

---

## Context

The current ReactWeb landing shell still contains migration/dev-process copy:

```txt
"A new React interface for the club"
"validates deployment, localized navigation, and same-origin proxy routes"
```

That made sense during the React migration, but it is no longer appropriate for the public site.

The current public shell also shows login/register calls to action in the hero body and always shows the member link in the header. That is not the desired site behavior.

The backend already exposes public landing data:

```txt
GET /api/public/posts
GET /api/public/events
```

This cleanup slice should use the public posts route for the landing page post area, but it should render a localized placeholder when the feed is empty.

## Desired Header Behavior

```txt
Always visible:
  brand link
  public home link
  language switcher

Only when logged out:
  login link/button
  register link/button

Only when logged in:
  member link/button

Only when logged in as admin:
  admin link/button
```

The member link visibility rule is intentionally simple for this slice: if `/api/me` returns a user, show the member link. The member page itself remains responsible for showing any pending/non-member informational state.

The admin link uses `role === "admin"`.

## Landing Page Content Direction

Use plausible placeholder club content until real copy is available. The page should feel like a chess club website, not an app migration status page.

Suggested Catalan-first content areas:

```txt
Hero:
  Club d'Escacs Calella
  Escacs, formació i competició a Calella
  A weekly place for casual games, training, and club tournaments.

Club details:
  weekly open play
  beginner and junior training
  local league teams
  friendly internal tournaments
  a central Calella meeting place

Membership:
  explain that registration starts the membership request
  avoid a second register/login CTA in the page body for this slice

Public posts:
  "Notícies del club"
  show approved public posts when available
  show an empty placeholder when none are public yet
```

The copy can be made up for now, but it must not present fake dates, addresses, fees, or official league details as fact. Use safe wording such as "sessions setmanals", "activitats del club", and "properament" where the real detail is unknown.

## Scope

```txt
create an auth-aware site navigation helper
create a shared ReactWeb site header component
use the shared header on public home, member posts, and admin users pages
hide member nav until a user is logged in
hide admin nav unless the logged-in user has role=admin
hide login/register nav once a user is logged in
move login/register actions out of the landing page body
replace dev/process landing copy with chess club copy
add a public posts section to the landing page
fetch /api/public/posts for the landing page
render a localized placeholder when there are no public posts
keep Catalan primary with Spanish and English translations
update ReactWeb docs and implementation log
deploy dev and live-smoke the landing page plus public posts API behavior
```

## Added Cleanup Items

These are included because they reduce drift while touching the same surface:

```txt
remove the "current section" status badge from the public landing page
make header link labels consistent across home/member/admin pages
keep the language switcher on the equivalent localized route where practical
avoid duplicating header markup in every route touched by this slice
add tests that fail if dev-process copy returns to the public landing page
add tests for logged-out/logged-in/admin nav visibility rules
```

## Out Of Scope

```txt
logout button
account dropdown
profile page
password reset implementation
events/calendar UI
admin post approval UI
real club address, fees, training schedule, or official claims
public event rendering on the landing page
landing page rich BlockNote rendering
server-side authenticated user preloading
```

Public event rendering is intentionally left out because the user asked about posts in this cleanup slice and events are planned as a later member UI slice.

## Route And Data Rules

```txt
/                  redirects to /ca
/{ca|es|en}        public landing page
/{ca|es|en}/member member shell
/{ca|es|en}/member/posts member posts workflow
/{ca|es|en}/admin admin shell
/{ca|es|en}/admin/users admin user management
```

Do not add broad dynamic route patterns that can collide with `/api/*` or `/auth/*`.

The landing page public posts feed:

```txt
GET /api/public/posts
returns only published public posts
does not require authentication
renders empty placeholder on empty array or fetch error
```

## File Structure

```txt
packages/web-react/app/components/SiteHeader.tsx
packages/web-react/app/lib/site-nav.ts
packages/web-react/app/lib/site-nav.test.ts
packages/web-react/app/lib/public-content-api.ts
packages/web-react/app/lib/public-content-api.test.ts
packages/web-react/app/routes/home.tsx
packages/web-react/app/routes/home.test.ts
packages/web-react/app/routes/member-posts.tsx
packages/web-react/app/routes/admin-users.tsx
packages/web-react/app/styles/tailwind.css

design/packages/web-react/overview.md
design/packages/web-react/react-router-structure.md
design/implementation/log.md
design/implementation/roadmap.md
```

## API Types

Reuse the existing post body preview helper for landing post summaries.

```ts
import type { PostBodyJson } from "./post-body";

export type PublicPost = {
  id: string;
  authorId: string;
  authorUsername: string;
  title: string;
  bodyJson: PostBodyJson;
  status: "published";
  isPublic: true;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: null;
  deletedBy: null;
};
```

Browser helper:

```ts
listPublicPosts(): Promise<ApiResult<{ posts: PublicPost[] }>>;
```

## Tasks

### Task 1: Add Auth-Aware Navigation Helpers

**Files:**

```txt
Create: packages/web-react/app/lib/site-nav.ts
Create: packages/web-react/app/lib/site-nav.test.ts
Modify: packages/web-react/app/lib/locale.ts
Modify: packages/web-react/app/lib/locale.test.ts
```

- [ ] Add `adminHomePath(locale)` returning `/${locale}/admin`.
- [ ] Add `visibleSiteNavItems({ locale, currentUser })`.
- [ ] Return home always.
- [ ] Return login/register only when `currentUser === null`.
- [ ] Return member only when `currentUser !== null`.
- [ ] Return admin only when `currentUser?.role === "admin"`.
- [ ] Add tests for logged-out, logged-in member, pending logged-in user, and logged-in admin visibility.
- [ ] Add tests for Catalan, Spanish, and English labels.
- [ ] Run:

```bash
npx vitest --run packages/web-react/app/lib/site-nav.test.ts packages/web-react/app/lib/locale.test.ts --config packages/web-react/vitest.config.ts
```

Expected: nav helper and locale tests pass.

### Task 2: Add Shared Site Header

**Files:**

```txt
Create: packages/web-react/app/components/SiteHeader.tsx
Modify: packages/web-react/app/routes/home.tsx
Modify: packages/web-react/app/routes/member-posts.tsx
Modify: packages/web-react/app/routes/admin-users.tsx
```

- [ ] Create `SiteHeader` with props:

```ts
type SiteHeaderProps = {
  locale: Locale;
  activeSection: "public" | "member" | "admin";
  languagePath: (locale: Locale) => string;
};
```

- [ ] In `SiteHeader`, call `getCurrentUser()` on mount.
- [ ] Treat `API_AUTH_REQUIRED` and `API_AUTH_INVALID` as logged out.
- [ ] Treat other `/api/me` errors as logged out for navigation only.
- [ ] Render nav items from `visibleSiteNavItems`.
- [ ] Keep language links in the top header.
- [ ] Use the shared header in `home.tsx`, `member-posts.tsx`, and `admin-users.tsx`.
- [ ] Keep page-specific auth/permission checks in their existing routes; the header is only navigation.
- [ ] Run:

```bash
npm run typecheck --workspace @CCC/web-react
```

Expected: typecheck passes.

### Task 3: Replace Landing Page Copy And Layout

**Files:**

```txt
Modify: packages/web-react/app/routes/home.tsx
Modify: packages/web-react/app/routes/home.test.ts
```

- [ ] Replace all dev/process copy with chess-club copy.
- [ ] Remove hero/body login and register buttons.
- [ ] Keep login/register available only through the shared header.
- [ ] Remove the "current section" status badge from the public landing page.
- [ ] Add localized sections:

```txt
Club overview
Training and casual play
Competition
Junior and beginner welcome
Membership request explanation
```

- [ ] Add tests that `COPY.ca.title` is club-focused.
- [ ] Add tests that public landing copy does not include:

```txt
React
desplegament
proxy
migration
deploy
```

- [ ] Run:

```bash
npx vitest --run packages/web-react/app/routes/home.test.ts --config packages/web-react/vitest.config.ts
```

Expected: home route tests pass.

### Task 4: Add Public Posts Landing Feed

**Files:**

```txt
Create: packages/web-react/app/lib/public-content-api.ts
Create: packages/web-react/app/lib/public-content-api.test.ts
Modify: packages/web-react/app/routes/home.tsx
Modify: packages/web-react/app/routes/home.test.ts
```

- [ ] Implement `listPublicPosts()` using same-origin `GET /api/public/posts`.
- [ ] Use `credentials: "same-origin"` for consistency, even though the route is public.
- [ ] Normalize stable API errors through the shared `ApiResult` type.
- [ ] In the landing page, load public posts after mount.
- [ ] Render up to the API-provided posts in a "club news" section.
- [ ] Use `previewPostBodyText(post.bodyJson)` for plain text previews.
- [ ] Show a localized placeholder when the array is empty or the API call fails.
- [ ] Add tests for the helper path/method and empty API error handling.
- [ ] Add route tests that the localized placeholder copy exists.
- [ ] Run:

```bash
npx vitest --run packages/web-react/app/lib/public-content-api.test.ts packages/web-react/app/routes/home.test.ts --config packages/web-react/vitest.config.ts
```

Expected: public content helper and home tests pass.

### Task 5: Verify The Full ReactWeb Slice

**Files:**

```txt
No additional files.
```

- [ ] Run:

```bash
npm test --workspace @CCC/web-react
npm run typecheck --workspace @CCC/web-react
npm run build --workspace @CCC/web-react
```

Expected: tests, typecheck, and build pass.

Notes:

```txt
React Router future flag warnings are acceptable if unchanged.
The existing BlockNote member posts chunk-size warning is acceptable if unchanged.
```

### Task 6: Update Docs, Deploy, And Record

**Files:**

```txt
Modify: design/packages/web-react/overview.md
Modify: design/packages/web-react/react-router-structure.md
Modify: design/implementation/roadmap.md
Modify: design/implementation/log.md
```

- [ ] Document the shared auth-aware header behavior.
- [ ] Document the ReactWeb landing page public posts placeholder.
- [ ] Move the roadmap current slice to:

```txt
020-reactweb-events-ui
```

- [ ] Deploy:

```bash
npx sst deploy --stage dev
```

- [ ] Live smoke:

```bash
node --input-type=module -e "const base='https://ccc-dev-reactwebworkerscript.robin-srimal.workers.dev'; const paths=['/ca','/es','/en','/api/public/posts','/api/me']; for (const path of paths) { const res=await fetch(base+path,{redirect:'manual'}); const text=await res.text(); console.log(path,res.status,res.headers.get('content-type'),text.slice(0,220).replace(/\\s+/g,' ')); }"
```

Expected:

```txt
/ca, /es, and /en return 200 HTML with chess-club copy.
/api/public/posts returns 200 JSON with posts array, likely empty.
/api/me returns 401 API_AUTH_REQUIRED when logged out.
```

- [ ] Add the implementation log entry with commit hash, verification, deploy, and live smoke results.

## Completion Criteria

```txt
The public landing page reads like a chess club site.
No public landing page copy references React migration, deployment validation, proxy validation, or dev process.
Login and register actions are only in the header.
The member navigation item appears only after /api/me returns a user.
The admin navigation item appears only after /api/me returns a user with role=admin.
The landing page has a public posts/news section.
The public posts/news section shows a localized placeholder when no approved public posts exist.
Home, member posts, and admin users routes use consistent top navigation.
ReactWeb tests, typecheck, and build pass.
The dev stage is deployed and live-smoked.
```

