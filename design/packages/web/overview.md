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

React is installed through the Astro React integration for interactive islands. The first islands are the login and registration forms.

When React components are embedded in Astro pages, hydrate them with the narrowest useful `client:*` directive. Static components should not be hydrated.

The localized public landing page fetches public posts and upcoming public events server-side from the linked Api Worker. If the feed request fails, the page renders localized empty states instead of failing the whole page.

The Web worker owns same-origin proxy routes:

```txt
/auth/* -> AuthApi service binding
/api/*  -> Api service binding
```

Browser UI must call these same-origin routes with `credentials: "same-origin"` so cookies stay scoped to the website origin.

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
