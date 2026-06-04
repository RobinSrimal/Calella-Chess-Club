# React Router Web Infrastructure

## Resource

```txt
ReactWeb
```

## SST Component

```ts
new sst.cloudflare.ReactRouter("ReactWeb", {
  path: "packages/web-react/",
  link: [api, authApi],
});
```

## Purpose

`ReactWeb` is the parallel React Router website used during the migration away from Astro. It should be deployed alongside the existing `Web` Astro resource until the React app has replaced the required user-facing workflows.

## Outputs

```txt
WebUrl
  Existing Astro website URL.

ReactWebUrl
  New React Router website URL.
```

## Backend Bindings

```txt
AuthApi
Api
```

The React Router app uses these bindings to preserve same-origin `/auth/*` and `/api/*` proxy routes.

