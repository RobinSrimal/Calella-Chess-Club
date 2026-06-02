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

## Links And Environment

The website should receive public API route configuration through environment variables. Secrets remain server-side and must not be exposed with a `PUBLIC_` prefix.
