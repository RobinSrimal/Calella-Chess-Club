# Web Package Overview

## Purpose

`packages/web` contains the Astro website. It provides the public landing page, auth screens, member area, and admin area.

## Astro Structure

```txt
packages/web/
  astro.config.mjs
  package.json
  tsconfig.json
  public/
  src/
    pages/
    layouts/
    components/
    styles/
    lib/
    i18n/
```

Astro routes are created from files in `src/pages`. Shared page shells live in `src/layouts`. Reusable UI lives in `src/components`.

## Rendering Strategy

Astro is the page, routing, layout, and deployment framework. React can be added later as Astro islands for interactive UI that needs browser state.

```txt
Use .astro for:
  pages
  layouts
  static content sections
  mostly-static translated UI

Use React .tsx islands for:
  login and registration forms
  post and event editors
  admin approval tables
  calendar interactions
  UI with client-side state or optimistic updates
```

React is installed through the Astro React integration for interactive islands. Current islands include the login form, registration form, auth-aware public navigation, member posts panel, and admin users panel.

When React components are embedded in Astro pages, hydrate them with the narrowest useful `client:*` directive. Static components should not be hydrated.

The public layout keeps its initial server-rendered navigation public. A small React island calls same-origin `/api/me` after hydration and replaces the login/register links with the member or admin link when the browser still has a valid session. This keeps the access cookie scoped to `/api` while avoiding an apparent logout when a signed-in user visits the public landing page.

Admins are treated as members with extra admin capability in the website UX. After login, admins land in the member area by default. Public signed-in navigation shows both member and admin links for admins, the admin layout includes a member link, and the member layout hydrates a small admin-only link back to the admin area.

The localized public landing page fetches public posts and upcoming public events server-side from the linked Api Worker. Public posts use parsed `bodyJson` arrays; the landing page flattens them into plain text previews until the richer BlockNote renderer is added. If the feed request fails, the page renders localized empty states instead of failing the whole page.

The member posts page mounts `MemberPostsPanel` with `client:load`. The panel calls same-origin `/api/me`, requires approved member or admin access, lists caller-visible posts, and supports draft creation, editing, explicit member-only publish, and soft delete. It uses `PostBlockEditor`, a restricted BlockNote editor with paragraph blocks, links, bold, and italic only. The editor sends native BlockNote JSON with empty `children: []` arrays; the backend remains the final validator.

The admin users page mounts `AdminUsersPanel` with `client:load`. The panel checks `/api/me`, requires admin access, lists users through `/api/admin/users`, and supports membership approval, rejection, restore, and account disablement. It does not expose user deletion or role-management actions.

The Web worker owns same-origin proxy routes:

```txt
/auth/* -> AuthApi service binding
/api/*  -> Api service binding
```

Browser UI must call these same-origin routes with `credentials: "same-origin"` so cookies stay scoped to the website origin. Browser helpers for unsafe methods without payload send `content-type: application/json` with an empty JSON body so Astro's origin-check middleware treats them as API requests rather than bodyless cross-site form submissions.

Form labels and status text follow the selected locale. Stable API error-code messages are intentionally English-only for the first version.

## Language Strategy

```txt
Primary: Catalan
Secondary: Spanish
Secondary: English
Routes: /ca, /es, /en
Cookie: ccc_locale
```

UI chrome is translated. Member-authored post and event content is stored once and displayed as original content in all locales for version 1.
