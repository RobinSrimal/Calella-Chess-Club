# React Router Structure

## Intended Source Tree

```txt
packages/web-react/
  app/
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
  package.json
  react-router.config.ts
  tsconfig.json
  vite.config.ts
  worker-configuration.d.ts
```

## Route Pattern

The first React Router slice should only prove the shell and infrastructure.

```txt
/                  -> redirect or render Catalan shell
/:locale           -> localized public shell
/:locale/member    -> member placeholder shell
/:locale/admin     -> admin placeholder shell
/auth/*            -> AuthApi proxy
/api/*             -> Api proxy
```

Later slices will migrate the real auth forms, public feeds, member posts, member events, and admin screens.

## Styling

Tailwind is scoped to the React package. Do not migrate Astro global CSS as part of the first shell slice.

