# Calella Chess Club

Cloudflare/SST app for the Calella Chess Club.

## Current Stack

- SST v4
- Cloudflare D1
- Cloudflare Workers under `packages/functions`
- React Router website under `packages/web-react`

## Setup

Install dependencies:

```bash
npm install
```

Create a repo-root `.env` file with the Cloudflare values documented in `design/infra/secrets.md`.

Deploy the current development stage:

```bash
npx sst deploy --stage dev
```

Check the current development-stage diff:

```bash
npx sst diff --stage dev
```

## Packages

- `packages/core`: shared domain code and tests.
- `packages/functions`: Cloudflare Worker code.
- `packages/web-react`: React Router website.
- `packages/scripts`: operational scripts run through `sst shell`.

## Design Docs

Design docs live under `design/` and mirror the intended code layout. Start with:

- `design/architecture.md`
- `design/implementation/roadmap.md`
- `design/implementation/log.md`

### Infrastructure

The `infra/` directory contains the active SST resources. The current deployed `dev` stage contains a single Cloudflare D1 database named `Database`.
