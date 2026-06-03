# Astro Structure

## Intended Source Tree

```txt
packages/web/src/
  pages/
    index.astro
    auth/
      [...path].ts
    api/
      [...path].ts
    [locale]/
      index.astro
      login.astro
      register.astro
      verify-email.astro
      forgot-password.astro
      reset-password.astro
      member/
        index.astro
        posts.astro
        events.astro
      admin/
        index.astro
        users.astro
        posts.astro
        events.astro
  layouts/
    PublicLayout.astro
    AppLayout.astro
    AdminLayout.astro
  components/
    LanguageSwitcher.astro
    forms/
      RegistrationForm.tsx
      LoginForm.tsx
    navigation/
      PublicAuthNav.tsx
      public-auth-nav-state.ts
    member/
      MemberPostsPanel.tsx
      member-posts-state.ts
    admin/
      MembershipQueue.tsx
    editor/
      PostBlockEditor.tsx
      EventEditor.tsx
  i18n/
    ca.ts
    es.ts
    en.ts
  lib/
    browser-api.ts
    email-verification.ts
    locale.ts
    post-body.ts
    proxy.ts
    public-feed.ts
  styles/
    global.css
```

## Route Rules

`index.astro` at the root handles `/`. It reads `ccc_locale` and routes to Catalan by default.

`[locale]` must only accept:

```txt
ca
es
en
```

Invalid locale paths should render a not-found response or redirect to `/ca`.

## Astro And React

The web package is Astro-first. `.astro` files own routes, layouts, server rendering, static sections, and translated chrome.

React is available as the client-side island framework. Current islands include auth forms and public auth-aware navigation. Expected future islands include member editors, calendar interactions, and admin review tables.

React islands must be embedded from Astro with explicit hydration directives:

```astro
<RegistrationForm client:load />
<MembershipQueue client:visible />
```

Use the least aggressive hydration mode that fits the workflow:

```txt
client:load
  For forms or controls needed immediately.

client:idle
  For secondary interactions that can wait until the browser is idle.

client:visible
  For below-the-fold panels and tables.
```

Do not hydrate static headings, translated copy, or other UI that does not need browser-side state. Navigation may hydrate when it depends on browser-only auth state, such as checking `/api/me` while the access cookie remains scoped to `/api`.
