# ReactWeb Logout And Session UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add logout controls and tighten logged-in session navigation across ReactWeb.

**Architecture:** Keep authentication owned by the existing AuthApi Worker and keep browser calls same-origin through `/auth/*` and `/api/*`. Extend the shared ReactWeb header so it can display the current username, expose a logout action, and keep account pages from showing stale route-local navigation. Keep page authorization checks separate from header link visibility.

**Tech Stack:** React Router v7 framework mode, React 19, TypeScript, Tailwind CSS v4, existing AuthApi/Api proxy routes, Vitest, SST dev deployment.

---

## Context

The backend already implements:

```txt
POST /auth/logout
  revokes the refresh session when a refresh cookie is present
  clears access and refresh cookies
  returns 204

GET /api/me
  returns the current user when the access cookie is valid
  returns API_AUTH_REQUIRED when logged out
```

The current ReactWeb shared header checks `/api/me` and changes nav visibility, but it does not expose a logout control or current user identity. Some account routes still have their own duplicated header markup, so logged-in/logged-out navigation can drift between pages.

## Scope

```txt
add a browser auth helper for POST /auth/logout
show the logged-in username in the shared header
show a localized logout button in the shared header when logged in
call /auth/logout from the header and clear client session state
after logout, navigate to the localized public landing page
keep login/register links hidden after /api/me returns a user
redirect already logged-in visitors away from login and register pages
move login, register, verify-email, forgot-password, and reset-password pages to the shared header
keep Catalan primary with Spanish and English translations
update ReactWeb docs and implementation log
deploy dev and live-smoke logged-out behavior plus logout endpoint behavior
```

## Added Cleanup Items

These are intentionally included because they touch the same session/navigation surface:

```txt
replace route-local auth/account headers with SiteHeader where practical
centralize logout copy in site-nav/session helpers
make the shared header resilient to logout network errors
avoid showing member/admin links on auth pages before /api/me resolves
add tests for username/logout visibility rules
add tests that login/register loaders keep their localized copy while the page no longer owns top nav copy
```

## Out Of Scope

```txt
profile/account page
account settings
change password
password reset backend implementation
admin post approval UI
landing page rich post rendering
server-side authenticated user preloading
logout confirmation modal
refresh-token rotation changes
```

## UX Rules

```txt
Logged out header:
  home
  login
  register
  language switcher

Logged in user header:
  home
  member
  username
  logout
  language switcher

Logged in admin header:
  home
  member
  admin
  username
  logout
  language switcher
```

Logout behavior:

```txt
click logout
disable the logout button while the request is in flight
POST /auth/logout with credentials same-origin and an empty JSON body
clear currentUser in SiteHeader regardless of whether the network request succeeds
navigate to /{locale}
```

Redirect behavior:

```txt
login page:
  if /api/me returns a user after client mount, navigate to /{locale}/member

register page:
  if /api/me returns a user after client mount, navigate to /{locale}/member
```

The redirect is client-side because the app currently loads `/api/me` from browser code and avoids server-side authenticated user preloading.

## File Structure

```txt
packages/web-react/app/components/SiteHeader.tsx
packages/web-react/app/components/SiteHeader.test.ts
packages/web-react/app/lib/auth-api.ts
packages/web-react/app/lib/auth-api.test.ts
packages/web-react/app/lib/site-nav.ts
packages/web-react/app/lib/site-nav.test.ts
packages/web-react/app/routes/login.tsx
packages/web-react/app/routes/login.test.ts
packages/web-react/app/routes/register.tsx
packages/web-react/app/routes/register.test.ts
packages/web-react/app/routes/verify-email.tsx
packages/web-react/app/routes/forgot-password.tsx
packages/web-react/app/routes/reset-password.tsx

design/packages/web-react/overview.md
design/packages/web-react/react-router-structure.md
design/implementation/log.md
design/implementation/roadmap.md
```

## API Contract

Browser helper:

```ts
export function logout(): Promise<ApiResult<null>>;
```

Implementation notes:

```txt
POST /auth/logout
credentials: same-origin
headers: content-type application/json
body: {}
204 responses normalize to ok true with data null
network errors normalize to AUTH_NETWORK_ERROR or existing NETWORK_ERROR depending on helper shape
```

If the existing shared `fetchJson` cannot handle empty `204` responses as `data: null`, add a small auth-specific helper that reads the status without requiring JSON.

## Tasks

### Task 1: Add Logout Browser Helper

**Files:**

```txt
Create: packages/web-react/app/lib/auth-api.ts
Create: packages/web-react/app/lib/auth-api.test.ts
```

- [ ] Add tests for `logout()` sending:

```txt
POST /auth/logout
credentials same-origin
content-type application/json
body {}
```

- [ ] Add tests for a `204` response returning:

```ts
{ ok: true, data: null, status: 204 }
```

- [ ] Add tests for stable auth errors and network errors.
- [ ] Implement the minimal helper.
- [ ] Run:

```bash
npx vitest --run packages/web-react/app/lib/auth-api.test.ts --config packages/web-react/vitest.config.ts
```

Expected: auth API helper tests pass.

### Task 2: Extend Site Navigation Copy And Helpers

**Files:**

```txt
Modify: packages/web-react/app/lib/site-nav.ts
Modify: packages/web-react/app/lib/site-nav.test.ts
```

- [ ] Add localized logout labels:

```txt
ca: Sortir
es: Salir
en: Log out
```

- [ ] Add `siteSessionCopy(locale)` returning localized logout and account labels.
- [ ] Keep `visibleSiteNavItems` unchanged except for any type changes needed by the header.
- [ ] Add tests for the logout label in Catalan, Spanish, and English.
- [ ] Run:

```bash
npx vitest --run packages/web-react/app/lib/site-nav.test.ts --config packages/web-react/vitest.config.ts
```

Expected: site navigation helper tests pass.

### Task 3: Add Logout And Username To SiteHeader

**Files:**

```txt
Modify: packages/web-react/app/components/SiteHeader.tsx
Create: packages/web-react/app/components/SiteHeader.test.ts
```

- [ ] Add tests for pure exported helpers first:

```ts
displayUsername({ username: "RobinSrimal", email: "robin@example.com" }) === "RobinSrimal"
displayUsername({ username: "", email: "robin@example.com" }) === "robin@example.com"
```

- [ ] Export a small pure `displayUsername(user)` helper for testing.
- [ ] In `SiteHeader`, render the username when `currentUser` is not null.
- [ ] Render a localized logout button when `currentUser` is not null.
- [ ] On click:

```txt
set isLoggingOut true
call logout()
set currentUser null
set isLoggingOut false
window.location.assign(localePath(locale))
```

- [ ] Disable the logout button while logout is in flight.
- [ ] Avoid rendering logout while logged out.
- [ ] Run:

```bash
npx vitest --run packages/web-react/app/components/SiteHeader.test.ts --config packages/web-react/vitest.config.ts
npm run typecheck --workspace @CCC/web-react
```

Expected: helper tests and typecheck pass.

### Task 4: Move Account Routes To Shared Header

**Files:**

```txt
Modify: packages/web-react/app/routes/login.tsx
Modify: packages/web-react/app/routes/register.tsx
Modify: packages/web-react/app/routes/verify-email.tsx
Modify: packages/web-react/app/routes/forgot-password.tsx
Modify: packages/web-react/app/routes/reset-password.tsx
Modify: packages/web-react/app/routes/login.test.ts
Modify: packages/web-react/app/routes/register.test.ts
```

- [ ] Replace route-local headers with `SiteHeader`.
- [ ] Use route-specific language path helpers:

```txt
login -> loginPath
register -> registerPath
verify-email -> verifyEmailPath(targetLocale, token)
forgot-password -> forgotPasswordPath
reset-password -> resetPasswordPath
```

- [ ] Remove now-unused nav copy fields from route copy types.
- [ ] Keep page titles, body copy, form fields, and existing submit behavior unchanged.
- [ ] Add or update route tests proving localized login/register copy still loads.
- [ ] Run:

```bash
npx vitest --run packages/web-react/app/routes/login.test.ts packages/web-react/app/routes/register.test.ts packages/web-react/app/routes/verify-email.test.ts packages/web-react/app/routes/password-utility.test.ts --config packages/web-react/vitest.config.ts
```

Expected: account route tests pass.

### Task 5: Redirect Logged-In Users From Login And Register

**Files:**

```txt
Modify: packages/web-react/app/routes/login.tsx
Modify: packages/web-react/app/routes/register.tsx
```

- [ ] Add a client-side effect on login and register pages:

```txt
call getCurrentUser()
if ok, window.location.assign(localePath(locale, "member"))
if API_AUTH_REQUIRED or API_AUTH_INVALID, remain on page
if other API error, remain on page
```

- [ ] Keep existing successful login redirect to `/{locale}/member`.
- [ ] Do not add a server-side loader redirect because `/api/me` auth is browser-owned in this app.
- [ ] Run:

```bash
npm run typecheck --workspace @CCC/web-react
```

Expected: typecheck passes.

### Task 6: Verify Full ReactWeb Slice

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

### Task 7: Update Docs, Deploy, And Record

**Files:**

```txt
Modify: design/packages/web-react/overview.md
Modify: design/packages/web-react/react-router-structure.md
Modify: design/implementation/roadmap.md
Modify: design/implementation/log.md
```

- [ ] Document logout behavior in the ReactWeb overview.
- [ ] Document that account routes use the shared header.
- [ ] Move roadmap current slice to:

```txt
021-password-reset-backend-ui
```

- [ ] Deploy:

```bash
npx sst deploy --stage dev
```

- [ ] Live smoke logged-out behavior:

```bash
node --input-type=module -e "const base='https://ccc-dev-reactwebworkerscript.robin-srimal.workers.dev'; const paths=['/ca','/ca/login','/ca/register','/api/me']; for (const path of paths) { const res=await fetch(base+path,{redirect:'manual'}); const text=await res.text(); console.log(path,res.status,res.headers.get('content-type'),text.slice(0,220).replace(/\\s+/g,' ')); }"
```

Expected:

```txt
/ca, /ca/login, and /ca/register return 200 HTML.
/api/me returns 401 API_AUTH_REQUIRED when logged out.
```

- [ ] Live smoke logout endpoint without cookies:

```bash
node --input-type=module -e "const res=await fetch('https://ccc-dev-reactwebworkerscript.robin-srimal.workers.dev/auth/logout',{method:'POST',headers:{'content-type':'application/json'},body:'{}'}); console.log(res.status); console.log([...res.headers].filter(([key]) => key.toLowerCase()==='set-cookie'));"
```

Expected:

```txt
204
set-cookie headers clear access and refresh cookies
```

- [ ] Add the implementation log entry with commit hash, verification, deploy, and live smoke results.

## Completion Criteria

```txt
Logged-in users see their username and a logout button in the shared header.
Logged-out users do not see username, logout, member, or admin links.
Logout posts to /auth/logout, clears local header session state, and navigates to /{locale}.
Login/register pages use the shared header.
Verify-email, forgot-password, and reset-password pages use the shared header.
Already logged-in visitors are redirected away from login/register to /{locale}/member.
ReactWeb tests, typecheck, and build pass.
The dev stage is deployed and live-smoked.
```

