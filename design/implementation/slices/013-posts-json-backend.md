# Posts JSON Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate posts from Markdown text storage to restricted BlockNote-compatible JSON storage in the backend.

**Architecture:** This slice changes only backend/data contracts. D1 stores the native editor document as canonical JSON text in `posts.body_json`; the App API accepts and returns `bodyJson` as a parsed JSON array. Frontend BlockNote installation and editor UI are deferred to the next slice. Server validation must enforce the small subset we want now so future UI mistakes cannot persist unsupported media or complex blocks.

**Tech Stack:** Cloudflare D1 migrations, Cloudflare Workers, TypeScript, Vitest, restricted BlockNote JSON shape stored as text.

---

## Context

BlockNote recommends storing `editor.document` JSON because it is its durable and lossless native document format. The default BlockNote schema includes many block types, including media/file-like blocks, so this backend slice must not accept arbitrary BlockNote JSON.

For version 1, posts support:

```txt
title: existing string field
bodyJson: parsed JSON array of BlockNote-style blocks at the API boundary
allowed block type: paragraph
allowed inline content: plain text spans, styled text spans, links
allowed inline styles: bold, italic
```

No images, files, tables, headings, lists, embeds, upload metadata, arbitrary colors, or nested child blocks are accepted in this slice.

## Scope

```txt
posts D1 migration from body_markdown to body_json
post repository read/write bodyJson
post API request/response bodyJson
post validation for restricted BlockNote-compatible paragraph JSON
public landing post feed returns bodyJson
tests for migration metadata, repository, validation, API, and public feed
docs updated to reflect JSON storage
dev deployment and backend smoke test
```

## Out Of Scope

```txt
installing BlockNote packages
member post editor UI
member event UI
admin content UI
rendering BlockNote JSON in Astro/React
uploads
support for headings/lists/quotes/tables/media
preserving existing Markdown post content
```

## Data Contract

### Stored Column

```txt
posts.body_json TEXT NOT NULL
```

The column stores a canonical serialized JSON array.

### API Field

```ts
type PostInlineText = {
  type: "text";
  text: string;
  styles?: {
    bold?: true;
    italic?: true;
  };
};

type PostInlineContent =
  | PostInlineText
  | {
      type: "link";
      href: string;
      content: PostInlineText[];
    };

type PostBodyJson = Array<{
  id?: string;
  type: "paragraph";
  props?: Record<string, unknown>;
  content?: string | PostInlineContent[];
}>;
```

Validation should accept a parsed array at the API boundary. For compatibility with BlockNote examples and future editor setup, a paragraph `content` value may be either a string or an array of inline content. Validation returns both the parsed canonical document for API responses and the canonical JSON string for repository storage.

### Empty Body Rule

At least one paragraph must contain non-whitespace text after flattening inline text and link text.

### Size Rules

```txt
max serialized JSON size: 20000 characters
max flattened text length: 10000 characters
max blocks: 100
max link href length: 2000
```

## Migration Rules

The migration intentionally does not preserve existing Markdown post rows:

```sql
CREATE TABLE posts_new (... body_json TEXT NOT NULL ...);
DROP TABLE posts;
ALTER TABLE posts_new RENAME TO posts;
```

This avoids leaving `body_markdown` in the active schema. Existing dev post rows are disposable for this migration.

## Tasks

### Task 1: Add Posts JSON Migration

- [x] Add `packages/db/migrations/0006_posts_body_json.sql`.
- [x] Update `packages/db/src/schema.test.ts` to assert `body_json TEXT NOT NULL` and no active `body_markdown`.
- [x] Update `design/packages/db/tables/posts.md`.
- [x] Run `npm test --workspace packages/db`.
- [x] Commit migration and table-doc changes.

### Task 2: Add Restricted Post Body JSON Validator

- [x] Create `packages/functions/src/posts/body-json.ts`.
- [x] Add tests in `packages/functions/src/posts/body-json.test.ts`.
- [x] Accept valid paragraph blocks with plain text, bold text, italic text, and links.
- [x] Reject empty bodies, invalid JSON, unsupported block types, nested child blocks, unsupported styles, media/file/table blocks, oversized text, oversized serialized JSON, too many blocks, and invalid link hrefs.
- [x] Return parsed canonical document, canonical serialized JSON, and flattened text length.
- [x] Run `npx vitest --run packages/functions/src/posts/body-json.test.ts`.
- [x] Commit validator changes.

### Task 3: Update Post Validation Contract

- [x] Update `packages/functions/src/posts/validation.ts` from `bodyMarkdown` to `bodyJson`.
- [x] Update `packages/functions/src/posts/validation.test.ts`.
- [x] Keep stable validation field name `bodyJson`.
- [x] Confirm create/edit validation trims title and canonicalizes body JSON.
- [x] Run `npx vitest --run packages/functions/src/posts/validation.test.ts`.
- [x] Commit validation changes.

### Task 4: Update Repository And API

- [x] Update `packages/functions/src/posts/repository.ts` types and SQL to use `body_json as bodyJson` internally as canonical JSON text.
- [x] Update `packages/functions/src/posts/repository.test.ts`.
- [x] Update `packages/functions/src/api.ts` post create/edit/public-feed response handling from `bodyMarkdown` to `bodyJson`, returning parsed JSON arrays in API responses.
- [x] Update `packages/functions/src/api.test.ts` post fixtures and assertions.
- [x] Ensure event routes still use `descriptionMarkdown`; this slice changes posts only.
- [x] Run `npm test --workspace packages/functions`.
- [x] Run `npm run typecheck --workspace packages/functions`.
- [x] Commit repository/API changes.

### Task 5: Update Web Public Feed Types Only

- [x] Update `packages/web/src/lib/public-feed.ts` post type from `bodyMarkdown` to parsed-array `bodyJson`.
- [x] Update `packages/web/src/lib/public-feed.test.ts`.
- [x] Keep the current landing page preview conservative: flatten `bodyJson` text and show a plain text preview.
- [x] Add a small helper such as `previewPostBodyText(bodyJson: PostBodyJson): string`.
- [x] Run `npm test --workspace packages/web`.
- [x] Run `npx tsc --noEmit -p packages/web/tsconfig.json`.
- [x] Commit web feed compatibility changes.

### Task 6: Apply Migration And Deploy Dev

- [x] Apply D1 migration to dev with `npx wrangler d1 execute ccc-dev-databasedatabase-budbdcht --remote --file packages/db/migrations/0006_posts_body_json.sql`.
- [x] Deploy with `npx sst deploy --stage dev`.
- [x] Smoke-test `POST /api/posts` through the Web origin with a temporary verified admin member and a paragraph-only `bodyJson`.
- [x] Smoke-test `GET /api/posts` and `GET /api/public/posts` response shape.
- [x] Delete temporary post/user/session rows.
- [x] Verify D1 cleanup counts are zero for temporary rows.
- [x] Update `design/implementation/log.md` and `design/implementation/roadmap.md`.
- [x] Commit final docs.

## Next Slice

```txt
014-member-post-blocknote-ui
```

The next slice should install BlockNote, create a restricted paragraph-first editor island, connect member post list/create/edit/publish/delete workflows to the JSON post APIs, and keep public visibility out of the member workflow.
