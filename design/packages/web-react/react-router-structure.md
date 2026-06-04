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
/:locale           -> localized public shell
/:locale/login     -> localized login form
/:locale/member    -> member placeholder shell
/:locale/admin     -> admin placeholder shell
/auth/*            -> AuthApi proxy
/api/*             -> Api proxy
```

Later slices will migrate the real auth forms, public feeds, member posts, member events, and admin screens.

The login route is a narrow exception added after the first deploy so ReactWeb has an obvious authentication path during migration. It posts to the existing same-origin `/auth/login` proxy and sends successful users to the localized member area.

The root `/` redirects to `/ca`. Invalid locale params fall back to Catalan in the shell.

## Cloudflare Build Notes

The React package uses `future.v8_viteEnvironmentApi` because the Cloudflare Vite plugin integrates through Vite environments.

The repo pins Vite 7 for the React package and root toolchain. Vite 8 produced a React Router SSR manifest timing issue during this slice, while Vite 7 works with React Router 7.16 and `@cloudflare/vite-plugin` 1.39.

`wrangler.local.jsonc` exists only so `npm run build --workspace @CCC/web-react` can run outside SST. Do not add a `wrangler.jsonc` file in this package; SST rejects it because SST generates and manages wrangler config for `sst.cloudflare.ReactRouter`.

The SST `ReactWeb` resource sets the deployed Worker compatibility date to `2025-08-15`. This is required for React 19 SSR because Cloudflare only exposes global `MessageChannel` by default from that date onward.

## Styling

Tailwind is scoped to the React package. Do not migrate Astro global CSS as part of the first shell slice.
