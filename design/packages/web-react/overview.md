# React Web Package Overview

## Purpose

`packages/web-react` is the planned React Router replacement for the current Astro website package. It will be built with React, TypeScript, Tailwind, and React Router, and deployed to Cloudflare through SST.

## Migration Position

The package will run in parallel with `packages/web` during migration.

```txt
packages/web
  Current Astro website.
  Deployed as SST resource Web.

packages/web-react
  New React Router website.
  Deployed as SST resource ReactWeb.
```

The React app will reuse the existing backend Workers and D1 database. It must not create a separate database or fork backend data.

## Backend Access

The React app should keep the same-origin proxy model:

```txt
/auth/* -> AuthApi Worker binding
/api/*  -> Api Worker binding
```

Browser code should continue to call same-origin paths with `credentials: "same-origin"`.

## First Slice

The first slice creates the deployable shell, Tailwind setup, localized route skeleton, and proxy routes. Full feature migration remains split into later slices.

