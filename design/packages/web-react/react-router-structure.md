# React Router Structure

## Intended Source Tree

```txt
packages/web-react/
  app/
    entry.server.tsx
    root.tsx
    routes.ts
    styles/
      tailwind.css
    lib/
      locale.ts
      locale.test.ts
      proxy.ts
      proxy.test.ts
    routes/
      home.tsx
      login.tsx
      register.tsx
      proxy-api.ts
      proxy-auth.ts
  public/
    images/
      club-hero.png
  workers/
    app.ts
  package.json
  react-router.config.ts
  sst-env.d.ts
  tsconfig.json
  virtual-modules.d.ts
  vite.config.ts
  vitest.config.ts
  worker-configuration.d.ts
  wrangler.local.jsonc
```

## Route Pattern

The first React Router slice should only prove the shell and infrastructure.

```txt
/                  -> redirect or render Catalan shell
/login             -> redirect to /ca/login
/register          -> redirect to /ca/register
/:locale           -> localized public shell
/ca/login          -> Catalan login form
/es/login          -> Spanish login form
/en/login          -> English login form
/ca/register       -> Catalan registration form
/es/register       -> Spanish registration form
/en/register       -> English registration form
/:locale/member    -> member placeholder shell
/:locale/admin     -> admin placeholder shell
/auth/*            -> AuthApi proxy
/api/*             -> Api proxy
```

Do not use `/:locale/login` or `/:locale/register`. Those dynamic routes can match `/auth/login` and `/auth/register` with `locale = "auth"` before the proxy routes run, causing POST requests to return React Router 405 HTML instead of AuthApi JSON.

The login and registration routes are narrow exceptions added after the first deploy so ReactWeb has obvious authentication paths during migration. Login posts to the existing same-origin `/auth/login` proxy and sends successful users to the localized member area. Registration posts to the existing same-origin `/auth/register` proxy and shows the email-verification success message.

The root `/` redirects to `/ca`. Invalid locale params fall back to Catalan in the shell.

## Current Migration Coverage

Implemented ReactWeb UI routes:

```txt
/
/login
/register
/{ca|es|en}
/{ca|es|en}/login
/{ca|es|en}/register
/{ca|es|en}/member
/{ca|es|en}/admin
```

Implemented ReactWeb backend proxy routes:

```txt
/auth/*
/api/*
```

Known ReactWeb UI routes still missing after the Astro removal:

```txt
/{ca|es|en}/verify-email
/{ca|es|en}/forgot-password
/{ca|es|en}/reset-password
/{ca|es|en}/member/posts
/{ca|es|en}/member/events
/{ca|es|en}/admin/users
/{ca|es|en}/admin/posts
/{ca|es|en}/admin/events
```

The backend endpoints for email verification, password reset, posts, events, admin users, and admin content remain in the existing Workers. The missing items above are ReactWeb page migrations, not separate backend resources.

## Cloudflare Build Notes

The React package uses `future.v8_viteEnvironmentApi` because the Cloudflare Vite plugin integrates through Vite environments.

The repo pins Vite 7 for the React package and root toolchain. Vite 8 produced a React Router SSR manifest timing issue during this slice, while Vite 7 works with React Router 7.16 and `@cloudflare/vite-plugin` 1.39.

`wrangler.local.jsonc` exists only so `npm run build --workspace @CCC/web-react` can run outside SST. Do not add a `wrangler.jsonc` file in this package; SST rejects it because SST generates and manages wrangler config for `sst.cloudflare.ReactRouter`.

The SST `ReactWeb` resource sets the deployed Worker compatibility date to `2025-08-15`. This is required for React 19 SSR because Cloudflare only exposes global `MessageChannel` by default from that date onward.

## Styling

Tailwind is scoped to the React package. Do not migrate Astro global CSS as part of the first shell slice.
