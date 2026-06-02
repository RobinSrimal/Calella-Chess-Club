# Astro Structure

## Intended Source Tree

```txt
packages/web/src/
  pages/
    index.astro
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
    MarkdownRenderer.astro
  i18n/
    ca.ts
    es.ts
    en.ts
  lib/
    api.ts
    locale.ts
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
