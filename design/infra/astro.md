# Astro Infrastructure

## Purpose

The public website and private UI are deployed with `sst.cloudflare.Astro`.

## Resource Shape

```ts
new sst.cloudflare.Astro("Web", {
  path: "packages/web",
});
```

The production version should add the final domain once chosen:

```ts
new sst.cloudflare.Astro("Web", {
  path: "packages/web",
  domain: {
    name: "calellachessclub.com",
    redirects: ["www.calellachessclub.com"],
  },
});
```

## Astro Adapter

The Astro Cloudflare adapter should use SST's generated Wrangler path:

```ts
adapter: cloudflare({
  platformProxy: {
    configPath: process.env.SST_WRANGLER_PATH,
  },
})
```

## React Islands

Astro can render React components through the Astro React integration. This does not require a separate Cloudflare resource.

The project should add React only when the first interactive island is implemented:

```bash
npx astro add react
```

Interactive auth forms, post/event editors, calendar controls, and admin tables can then be written as `.tsx` components and hydrated from `.astro` pages with explicit `client:*` directives. Non-interactive layout and content should remain `.astro`.

## Links And Environment

The website should receive public API route configuration through environment variables. Secrets remain server-side and must not be exposed with a `PUBLIC_` prefix.
