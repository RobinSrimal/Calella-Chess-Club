# Worker Infrastructure

## Purpose

The backend is split into two Cloudflare Workers.

## Auth Worker

```ts
new sst.cloudflare.Worker("AuthApi", {
  handler: "packages/functions/src/auth.ts",
});
```

Responsibilities:

```txt
/auth/register
/auth/login
/auth/logout
/auth/refresh
/auth/verify-email
/auth/forgot-password
/auth/reset-password
```

The auth Worker links to D1 and auth/email secrets.

## App API Worker

```ts
new sst.cloudflare.Worker("Api", {
  handler: "packages/functions/src/api.ts",
});
```

Responsibilities:

```txt
/api/me
/api/admin/*
/api/posts/*
/api/events/*
/api/public/*
```

The app API Worker links to D1 and the JWT verification secret or public key.

## Cookie Paths

```txt
ccc_access_token:
  Path=/api

ccc_refresh_token:
  Path=/auth
```

This keeps refresh tokens away from general application routes.
