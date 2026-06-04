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
      account-api.ts
      account-api.test.ts
      admin-users-state.ts
      admin-users-state.test.ts
      locale.ts
      locale.test.ts
      proxy.ts
      proxy.test.ts
    routes/
      admin-users.tsx
      admin-users.test.ts
      forgot-password.tsx
      home.tsx
      login.tsx
      password-utility.test.ts
      register.tsx
      reset-password.tsx
      verify-email.tsx
      verify-email.test.ts
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
/ca/verify-email   -> Catalan email verification page
/es/verify-email   -> Spanish email verification page
/en/verify-email   -> English email verification page
/ca/forgot-password -> Catalan password support information page
/es/forgot-password -> Spanish password support information page
/en/forgot-password -> English password support information page
/ca/reset-password -> Catalan password reset information page
/es/reset-password -> Spanish password reset information page
/en/reset-password -> English password reset information page
/:locale/member    -> member placeholder shell
/:locale/admin     -> admin placeholder shell
/ca/admin/users    -> Catalan admin user management page
/es/admin/users    -> Spanish admin user management page
/en/admin/users    -> English admin user management page
/auth/*            -> AuthApi proxy
/api/*             -> Api proxy
```

Do not use `/:locale/login`, `/:locale/register`, `/:locale/verify-email`, `/:locale/forgot-password`, `/:locale/reset-password`, or `/:locale/admin/users`. Those dynamic routes can match backend proxy paths such as `/auth/login`, `/auth/verify-email`, and `/api/admin/users` before the proxy routes run, causing API requests to return React Router HTML instead of Worker JSON.

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
/{ca|es|en}/verify-email
/{ca|es|en}/forgot-password
/{ca|es|en}/reset-password
/{ca|es|en}/member
/{ca|es|en}/admin
/{ca|es|en}/admin/users
```

Implemented ReactWeb backend proxy routes:

```txt
/auth/*
/api/*
```

Known ReactWeb UI routes still missing after the Astro removal:

```txt
/{ca|es|en}/member/posts
/{ca|es|en}/member/events
/{ca|es|en}/admin/posts
/{ca|es|en}/admin/events
```

The email verification page calls the existing AuthApi verification route. The forgot/reset password pages are informational only because AuthApi does not implement password reset endpoints yet.

The backend endpoints for posts, events, admin users, and admin content remain in the existing Workers. The missing items above are ReactWeb page migrations, not separate backend resources.

## Cloudflare Build Notes

The React package uses `future.v8_viteEnvironmentApi` because the Cloudflare Vite plugin integrates through Vite environments.

The repo pins Vite 7 for the React package and root toolchain. Vite 8 produced a React Router SSR manifest timing issue during this slice, while Vite 7 works with React Router 7.16 and `@cloudflare/vite-plugin` 1.39.

`wrangler.local.jsonc` exists only so `npm run build --workspace @CCC/web-react` can run outside SST. Do not add a `wrangler.jsonc` file in this package; SST rejects it because SST generates and manages wrangler config for `sst.cloudflare.ReactRouter`.

The SST `ReactWeb` resource sets the deployed Worker compatibility date to `2025-08-15`. This is required for React 19 SSR because Cloudflare only exposes global `MessageChannel` by default from that date onward.

## Styling

Tailwind is scoped to the React package. Do not migrate Astro global CSS as part of the first shell slice.
