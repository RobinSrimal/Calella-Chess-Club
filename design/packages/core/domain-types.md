# Core Domain Types

## Purpose

`packages/core` holds shared TypeScript domain types and small pure utilities used across Workers, scripts, and the website.

## Intended Types

```ts
type Locale = "ca" | "es" | "en";
type AccountStatus = "active" | "disabled";
type MembershipStatus = "none" | "pending" | "member" | "rejected";
type Role = "user" | "admin";
type ContentStatus = "draft" | "published" | "deleted";
```

## Rules

`packages/core` must not depend on Cloudflare runtime bindings, Astro components, or D1 clients.
