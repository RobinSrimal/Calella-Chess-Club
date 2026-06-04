# Calella Chess Club Architecture

## Purpose

The application is a public website and private member platform for Calella Chess Club. It supports a public multilingual landing page, member-created posts and calendar events, admin membership approval, and admin curation of which member content appears publicly.

## Runtime Shape

The app is deployed with SST and Cloudflare.

```txt
SST
├─ sst.cloudflare.ReactRouter -> packages/web-react
├─ sst.cloudflare.Worker -> packages/functions auth Worker
├─ sst.cloudflare.Worker -> packages/functions app API Worker
└─ sst.cloudflare.D1     -> packages/db migrations/schema
```

The existing `packages/functions` package remains the backend package. Although Cloudflare calls the deployed backend resources Workers, SST supports pointing Cloudflare Worker handlers at paths inside `packages/functions`.

## Code Areas

```txt
infra/
  SST resource definitions for Cloudflare resources, secrets, domains, and bindings

packages/web-react/
  React Router website for public, member, and admin UI

packages/functions/
  Cloudflare Worker APIs for auth, users, posts, events, and admin actions

packages/db/
  D1 schema and migrations

packages/scripts/
  Operational scripts, including first-admin promotion

packages/core/
  Shared TypeScript utilities and domain types used across packages
```

## Design Documents

The design folder mirrors the intended code areas and important substructures:

```txt
design/architecture.md
design/infra/
design/packages/web-react/
design/packages/functions/
design/packages/db/
design/packages/scripts/
design/packages/core/
```

## Primary Flows

Registration:

```txt
register -> verify email -> active user -> pending membership -> admin decision
```

Content:

```txt
draft -> published to members -> optionally public on landing page -> soft deleted
```

Authentication:

```txt
login through auth Worker -> 2-hour access JWT cookie + 14-day opaque refresh cookie
```

## External Services

Resend is the intended transactional email provider for email verification and password reset. The design should keep this behind a small email abstraction so another provider can replace it later.

## Not In Version 1

Version 1 does not include uploads, R2 storage, recurring events, event RSVP, rich text editors, or public setup routes.
