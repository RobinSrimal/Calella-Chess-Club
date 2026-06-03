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
converting existing production content beyond a safe dev-compatible migration
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

The migration should be safe for existing dev rows:

```sql
ALTER TABLE posts ADD COLUMN body_json TEXT;
UPDATE posts
SET body_json = json_array(
  json_object(
    'type', 'paragraph',
    'content', json_array(
      json_object(
        'type', 'text',
        'text', body_markdown,
        'styles', json_object()
      )
    )
  )
)
WHERE body_json IS NULL;
```

Then create a new `posts_new` table with `body_json TEXT NOT NULL`, copy rows, drop old `posts`, rename, and recreate indexes. This avoids leaving `body_markdown` in the active schema.

## Tasks

### Task 1: Add Posts JSON Migration

- [ ] Add `packages/db/migrations/0006_posts_body_json.sql`.
- [ ] Update `packages/db/src/schema.test.ts` to assert `body_json TEXT NOT NULL` and no active `body_markdown`.
- [ ] Update `design/packages/db/tables/posts.md`.
- [ ] Run `npm test --workspace packages/db`.
- [ ] Commit migration and table-doc changes.

### Task 2: Add Restricted Post Body JSON Validator

- [ ] Create `packages/functions/src/posts/body-json.ts`.
- [ ] Add tests in `packages/functions/src/posts/body-json.test.ts`.
- [ ] Accept valid paragraph blocks with plain text, bold text, italic text, and links.
- [ ] Reject empty bodies, invalid JSON, unsupported block types, nested child blocks, unsupported styles, media/file/table blocks, oversized text, oversized serialized JSON, too many blocks, and invalid link hrefs.
- [ ] Return parsed canonical document, canonical serialized JSON, and flattened text length.
- [ ] Run `npx vitest --run packages/functions/src/posts/body-json.test.ts`.
- [ ] Commit validator changes.

### Task 3: Update Post Validation Contract

- [ ] Update `packages/functions/src/posts/validation.ts` from `bodyMarkdown` to `bodyJson`.
- [ ] Update `packages/functions/src/posts/validation.test.ts`.
- [ ] Keep stable validation field name `bodyJson`.
- [ ] Confirm create/edit validation trims title and canonicalizes body JSON.
- [ ] Run `npx vitest --run packages/functions/src/posts/validation.test.ts`.
- [ ] Commit validation changes.

### Task 4: Update Repository And API

- [ ] Update `packages/functions/src/posts/repository.ts` types and SQL to use `body_json as bodyJson` internally as canonical JSON text.
- [ ] Update `packages/functions/src/posts/repository.test.ts`.
- [ ] Update `packages/functions/src/api.ts` post create/edit/public-feed response handling from `bodyMarkdown` to `bodyJson`, returning parsed JSON arrays in API responses.
- [ ] Update `packages/functions/src/api.test.ts` post fixtures and assertions.
- [ ] Ensure event routes still use `descriptionMarkdown`; this slice changes posts only.
- [ ] Run `npm test --workspace packages/functions`.
- [ ] Run `npm run typecheck --workspace packages/functions`.
- [ ] Commit repository/API changes.

### Task 5: Update Web Public Feed Types Only

- [ ] Update `packages/web/src/lib/public-feed.ts` post type from `bodyMarkdown` to parsed-array `bodyJson`.
- [ ] Update `packages/web/src/lib/public-feed.test.ts`.
- [ ] Keep the current landing page preview conservative: flatten `bodyJson` text and show a plain text preview.
- [ ] Add a small helper such as `previewPostBodyText(bodyJson: PostBodyJson): string`.
- [ ] Run `npm test --workspace packages/web`.
- [ ] Run `npx tsc --noEmit -p packages/web/tsconfig.json`.
- [ ] Commit web feed compatibility changes.

### Task 6: Apply Migration And Deploy Dev

- [ ] Apply D1 migration to dev with `npx wrangler d1 migrations apply ccc-dev-databasedatabase-budbdcht --remote --migrations-dir packages/db/migrations`.
- [ ] Deploy with `npx sst deploy --stage dev`.
- [ ] Smoke-test `POST /api/posts` through the Web origin with a temporary verified member user and a paragraph-only `bodyJson`.
- [ ] Smoke-test `GET /api/posts` and `GET /api/public/posts` response shape.
- [ ] Delete temporary post/user/session rows.
- [ ] Verify D1 cleanup counts are zero for temporary rows.
- [ ] Update `design/implementation/log.md` and `design/implementation/roadmap.md`.
- [ ] Commit final docs.

## Next Slice

```txt
014-member-post-blocknote-ui
```

The next slice should install BlockNote, create a restricted paragraph-first editor island, connect member post list/create/edit/publish/delete workflows to the JSON post APIs, and keep public visibility out of the member workflow.
