# ReactWeb Component And Backend Test Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a practical Vitest-based testing foundation for rendered React components and fill targeted backend session/error coverage gaps.

**Architecture:** Keep Vitest as the single test runner for ReactWeb and backend Workers. Add React Testing Library only to `packages/web-react`, run component tests in jsdom, and keep existing helper/loader tests in the current node environment. Backend tests stay in `packages/functions` and continue to call testable Worker handlers directly.

**Tech Stack:** Vitest, React Testing Library, user-event, jest-dom matchers for Vitest, jsdom, React Router v7 framework mode, React 19, TypeScript, Cloudflare Worker handler tests.

---

## Context

The repo already uses Vitest:

```txt
packages/web-react
  helper, API helper, route-loader, and small component-helper tests

packages/functions
  auth, jwt, cookies, password, email, repository, posts, events, and API handler tests
```

The missing piece is rendered React component testing. Current ReactWeb tests mostly validate pure helpers and route loaders. That is useful, but it does not catch issues such as a header link not rendering, a logout button not calling the right handler, or a user interaction failing because the component tree needs router context.

React Router's official testing guidance supports `createRoutesStub` for reusable components that need router context. It also warns against treating full framework route modules as simple unit-test targets. This slice follows that guidance: build rendered component tests for reusable components first, and leave route-level browser coverage for a later Playwright/integration slice if needed.

## Scope

```txt
add React Testing Library dependencies to packages/web-react
configure Vitest setup for jest-dom matchers
keep web-react's default test environment as node
use per-file jsdom environment for rendered component tests
add reusable ReactWeb test helpers for router rendering and user fixtures
add rendered SiteHeader tests for logged-out, member, admin, and logout states
make SiteHeader testable without changing runtime behavior
add targeted backend session/error tests around logout without cookies and /api/me missing-user behavior
update ReactWeb and implementation docs
run web-react and functions verification
record the implementation in the log
```

## Out Of Scope

```txt
switching from Vitest to Jest
Playwright or browser E2E tests
snapshot-heavy component tests
testing every route module as a React unit test
full login/register form extraction
admin post approval UI
password reset implementation
dev deployment unless production behavior changes beyond test seams
```

## Testing Strategy

Use three levels of tests:

```txt
pure helper tests
  node environment
  existing style
  fast and focused

rendered component tests
  jsdom environment per file
  @testing-library/react
  @testing-library/user-event
  @testing-library/jest-dom/vitest
  focus on observable DOM and user interaction

backend handler tests
  node environment
  call handleAuthRequest and handleApiRequest directly
  assert stable status codes, JSON errors, repository calls, and cookie behavior
```

Avoid:

```txt
large snapshots
asserting Tailwind class strings except when behavior truly depends on them
mocking React Router internals
testing implementation details such as React state variable names
duplicating backend cases that are already covered
```

## File Structure

```txt
packages/web-react/package.json
package-lock.json
packages/web-react/vitest.config.ts
packages/web-react/app/test/setup.ts
packages/web-react/app/test/render.tsx
packages/web-react/app/test/users.ts
packages/web-react/app/components/SiteHeader.tsx
packages/web-react/app/components/SiteHeader.render.test.tsx

packages/functions/src/auth.test.ts
packages/functions/src/api.test.ts

design/packages/web-react/react-router-structure.md
design/implementation/roadmap.md
design/implementation/log.md
```

## Design Decisions

### Vitest Instead Of Jest

Vitest remains the test runner because the repo already uses Vite, React Router framework mode, and Cloudflare-oriented packages. The test syntax stays Jest-like (`describe`, `test`, `expect`, `vi`) without adding a second runner and duplicate config surface.

### jsdom Per Render Test

Keep `packages/web-react/vitest.config.ts` on:

```ts
environment: "node"
```

Rendered component test files should opt into jsdom with:

```ts
// @vitest-environment jsdom
```

This avoids moving all loader/API helper tests into a browser-like environment.

### SiteHeader Test Seam

`SiteHeader` currently calls `window.location.assign()` directly after logout. Add an optional `navigate` prop so tests can assert navigation without fighting jsdom's `window.location` implementation:

```ts
type SiteHeaderProps = {
  locale: Locale;
  activeSection: ShellSection;
  languagePath: (locale: Locale) => string;
  navigate?: (path: string) => void;
};
```

Runtime callers do not pass `navigate`; the default remains:

```ts
const navigateTo = navigate ?? ((path: string) => window.location.assign(path));
```

Logout then calls:

```ts
navigateTo(localePath(locale));
```

This is a test seam, not a behavior change.

## Tasks

### Task 1: Add ReactWeb Component Test Dependencies

**Files:**

```txt
Modify: packages/web-react/package.json
Modify: package-lock.json
Modify: packages/web-react/vitest.config.ts
Create: packages/web-react/app/test/setup.ts
Create: packages/web-react/app/test/render.tsx
Create: packages/web-react/app/test/users.ts
```

- [ ] Install ReactWeb-only dev dependencies:

```bash
npm install --workspace @CCC/web-react --save-dev @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

- [ ] Update `packages/web-react/vitest.config.ts` to keep node as the default environment and load jest-dom matchers:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./app/test/setup.ts"],
  },
});
```

- [ ] Create `packages/web-react/app/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] Create `packages/web-react/app/test/render.tsx`:

```tsx
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router";

export function renderWithRouter(
  ui: ReactElement,
  {
    initialEntries = ["/ca"],
    ...options
  }: RenderOptions & { initialEntries?: string[] } = {},
) {
  return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>, options);
}
```

- [ ] Create `packages/web-react/app/test/users.ts`:

```ts
import type { PublicUser } from "../lib/account-api";

export function publicUser(overrides: Partial<PublicUser> = {}): PublicUser {
  return {
    id: "user-1",
    username: "member",
    email: "member@example.com",
    emailVerified: true,
    membershipStatus: "member",
    role: "user",
    ...overrides,
  };
}
```

- [ ] Run:

```bash
npm test --workspace @CCC/web-react
```

Expected: existing ReactWeb tests still pass.

### Task 2: Add Rendered SiteHeader Tests

**Files:**

```txt
Modify: packages/web-react/app/components/SiteHeader.tsx
Create: packages/web-react/app/components/SiteHeader.render.test.tsx
```

- [ ] Write failing rendered tests first.
- [ ] Mock `getCurrentUser` and `logout`.
- [ ] Test logged-out navigation:

```txt
/api/me returns API_AUTH_REQUIRED
header shows Inici, Entrar, Registrar-se
header does not show Membres, Admin, Sortir, or a username
language links render CA, ES, EN
```

- [ ] Test logged-in member navigation:

```txt
/api/me returns a user with role=user
header shows Inici, Membres, username, Sortir
header does not show Admin
login/register are hidden
```

- [ ] Test logged-in admin navigation:

```txt
/api/me returns a user with role=admin
header shows Inici, Membres, Admin, username, Sortir
```

- [ ] Test logout interaction:

```txt
/api/me returns a member
click Sortir
logout() is called once
button is disabled while logout is pending
navigate callback receives /ca
username is removed after logout completes
```

- [ ] Update `SiteHeader` with the optional `navigate` prop described above.
- [ ] Run:

```bash
npx vitest --run packages/web-react/app/components/SiteHeader.test.ts packages/web-react/app/components/SiteHeader.render.test.tsx --config packages/web-react/vitest.config.ts
```

Expected: pure helper and rendered SiteHeader tests pass.

### Task 3: Add Backend Session/Error Gap Tests

**Files:**

```txt
Modify: packages/functions/src/auth.test.ts
Modify: packages/functions/src/api.test.ts
```

- [ ] Add a failing AuthApi handler test:

```txt
POST /auth/logout with no refresh cookie returns 204
response body is empty
access cookie is cleared
refresh cookie is cleared
repository.revokeRefreshSessionByTokenHash is not called
```

- [ ] Add a failing Api handler test:

```txt
GET /api/me with a valid JWT for a missing user returns 401 API_AUTH_INVALID
repository.findPublicUserById is called with the JWT user id
```

- [ ] Implement only the minimal backend changes if either test reveals a behavior gap.
- [ ] Run:

```bash
npm test --workspace @CCC/functions
npm run typecheck --workspace @CCC/functions
```

Expected: backend tests and typecheck pass.

### Task 4: Verify Full Slice

**Files:**

```txt
No additional files.
```

- [ ] Run:

```bash
npm test --workspace @CCC/web-react
npm run typecheck --workspace @CCC/web-react
npm run build --workspace @CCC/web-react
npm test --workspace @CCC/functions
npm run typecheck --workspace @CCC/functions
```

Expected:

```txt
ReactWeb tests pass.
ReactWeb typecheck passes.
ReactWeb build passes.
Functions tests pass.
Functions typecheck passes.
```

Notes:

```txt
React Router future flag warnings are acceptable if unchanged.
The existing BlockNote member posts chunk-size warning is acceptable if unchanged.
```

### Task 5: Update Docs And Record

**Files:**

```txt
Modify: design/packages/web-react/react-router-structure.md
Modify: design/implementation/roadmap.md
Modify: design/implementation/log.md
```

- [ ] Document the new component test utilities and rendered SiteHeader tests.
- [ ] Move roadmap current slice back to:

```txt
021-password-reset-backend-ui
```

or, if password reset is deferred again, update the roadmap to the next selected slice.

- [ ] Add an implementation log entry with:

```txt
commit hash
files changed
verification commands
verification results
whether deployment was skipped or run
```

- [ ] Commit implementation and log entries separately when useful.

## Completion Criteria

```txt
ReactWeb has Testing Library installed and configured through Vitest.
Rendered React component tests run in jsdom without moving all tests to jsdom.
SiteHeader rendered tests cover logged-out, member, admin, and logout behavior.
Backend session/error tests cover logout without cookies and /api/me missing-user behavior.
ReactWeb tests, typecheck, and build pass.
Functions tests and typecheck pass.
Docs and implementation log are updated.
```

## References

```txt
React Router testing guide:
https://reactrouter.com/start/framework/testing

Vitest environment guide:
https://v3.vitest.dev/guide/environment
```
