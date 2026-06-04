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
  transform: {
    server: {
      compatibility: {
        date: "2025-08-15",
        flags: ["nodejs_compat"],
      },
    },
  },
});
```

## Purpose

`ReactWeb` is the active React Router website for the app.

## Outputs

```txt
ReactWebUrl
  Active website URL.
```

`ReactWebUrl` is exported from `sst.config.ts`.

## Backend Bindings

```txt
AuthApi
Api
```

The React Router app uses these bindings to preserve same-origin `/auth/*` and `/api/*` proxy routes.

## Build Contract

SST expects the React Router server bundle at:

```txt
packages/web-react/build/server/index.js
```

The React package keeps React Router's default `build` output directory for SST compatibility.

## Worker Compatibility

`ReactWeb` uses Cloudflare compatibility date `2025-08-15` so global `MessageChannel` is available to React 19 server rendering. Keep `nodejs_compat` enabled. Do not also set `expose_global_message_channel` on this date because Cloudflare treats it as redundant and rejects the Worker upload.
