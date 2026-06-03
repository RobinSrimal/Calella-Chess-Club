# Member Post BlockNote UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build the first usable member post workflow with a restricted BlockNote editor backed by the existing JSON post APIs.

**Architecture:** The website stays Astro-first. The member posts page mounts one React island that checks the current user, loads the caller-visible posts, and drives create/edit/publish/delete actions through same-origin `/api/*` calls. The editor uses a restricted BlockNote schema and the backend remains the final validator for allowed JSON.

**Tech Stack:** Astro, React islands, BlockNote React/Mantine, Cloudflare Worker same-origin proxy routes, TypeScript, Vitest.

---

## References

```txt
BlockNote getting started:
https://www.blocknotejs.org/docs/getting-started

BlockNote document structure:
https://www.blocknotejs.org/docs/foundations/document-structure

BlockNote custom schemas:
https://www.blocknotejs.org/docs/features/custom-schemas
```

## Context

Slice 013 changed the backend post contract from Markdown to restricted `bodyJson`. The backend currently accepts paragraph blocks with text, bold, italic, and links. It rejects media, files, tables, headings, lists, arbitrary styles, and nested child blocks.

BlockNote native block objects include a `children` field. For a paragraph-only editor, that field should normally be an empty array. This slice should make the backend accept `children: []` while still rejecting any non-empty nested children. That lets the UI submit `editor.document` without inventing a separate document format.

## File Structure

```txt
packages/web/package.json
package-lock.json

packages/functions/src/posts/body-json.ts
packages/functions/src/posts/body-json.test.ts

packages/web/src/lib/post-body.ts
packages/web/src/lib/post-body.test.ts
packages/web/src/lib/public-feed.ts
packages/web/src/lib/public-feed.test.ts
packages/web/src/lib/browser-api.ts
packages/web/src/lib/browser-api.test.ts

packages/web/src/components/editor/PostBlockEditor.tsx
packages/web/src/components/member/MemberPostsPanel.tsx
packages/web/src/components/member/member-posts-state.ts
packages/web/src/components/member/member-posts-state.test.ts

packages/web/src/pages/[locale]/member/posts.astro
packages/web/src/i18n/ca.ts
packages/web/src/i18n/es.ts
packages/web/src/i18n/en.ts
packages/web/src/styles/global.css

design/packages/functions/routes/posts.md
design/packages/web/astro-structure.md
design/packages/web/overview.md
design/implementation/log.md
design/implementation/roadmap.md
```

## Scope

```txt
accept native BlockNote paragraph blocks with empty children arrays
install BlockNote React/Mantine packages
add shared web post body JSON types and text-preview helpers
add browser post API helpers for list/create/update/publish/delete
add a restricted paragraph-only BlockNote editor island
add a member posts panel with draft, save, publish, and delete workflows
hydrate /{locale}/member/posts with the member posts panel
add Catalan, Spanish, and English labels for the member posts UI
show English-only stable API error-code messages
verify locally, deploy dev, and smoke-test through the Web origin
```

## Out Of Scope

```txt
member event UI
admin post/event review UI
admin public visibility toggles
landing page BlockNote rendering
uploads or images
headings, lists, quotes, tables, embeds, colors, underline, strike, nesting, or custom blocks
autosave
post revision history
comments
```

## UI Rules

```txt
The page loads through /{locale}/member/posts.
The island calls GET /api/me before showing post controls.
Only members and admins can load the post list.
Users with pending or rejected membership see an informational state, not the editor.
New posts always start as drafts.
Drafts are visible only to the creator because the API enforces this.
Publishing is explicit and always member-only from this UI.
The member UI never sends makePublic=true.
Delete uses the existing soft-delete API action.
Admins using this member page follow the same member-only default workflow.
```

## Data Contract

### Post Body JSON

```ts
export type PostInlineText = {
  type: "text";
  text: string;
  styles: {
    bold?: true;
    italic?: true;
  };
};

export type PostInlineLink = {
  type: "link";
  href: string;
  content: PostInlineText[];
};

export type PostBodyBlock = {
  id?: string;
  type: "paragraph";
  props?: {
    backgroundColor: "default";
    textColor: "default";
    textAlignment: "left";
  };
  content?: string | Array<PostInlineText | PostInlineLink>;
  children?: [];
};

export type PostBodyJson = PostBodyBlock[];
```

### Browser API Helpers

```ts
listPosts(): Promise<ApiResult<{ posts: MemberPost[] }>>;
createPost(input: { title: string; bodyJson: PostBodyJson }): Promise<ApiResult<{ post: MemberPost }>>;
updatePost(id: string, input: { title: string; bodyJson: PostBodyJson }): Promise<ApiResult<{ post: MemberPost }>>;
publishPost(id: string): Promise<ApiResult<{ post: MemberPost }>>;
deletePost(id: string): Promise<ApiResult<{ post: MemberPost }>>;
```

`publishPost` must send `{ "makePublic": false }`.

## Tasks

### Task 1: Align Backend With Native BlockNote Empty Children

**Files:**

```txt
Modify: packages/functions/src/posts/body-json.ts
Modify: packages/functions/src/posts/body-json.test.ts
Modify: design/packages/functions/routes/posts.md
```

- [x] Add tests proving a paragraph block with `children: []` is accepted.
- [x] Add tests proving a paragraph block with one or more child blocks is rejected.
- [x] Update `parseParagraphBlock` to permit only an empty `children` array.
- [x] Keep media, file, table, heading, list, arbitrary style, and non-empty nested child rejection unchanged.
- [x] Run `npx vitest --run packages/functions/src/posts/body-json.test.ts`.
- [x] Run `npm test --workspace packages/functions`.
- [x] Commit backend contract alignment.

### Task 2: Install BlockNote

**Files:**

```txt
Modify: packages/web/package.json
Modify: package-lock.json
```

- [x] Add `@blocknote/core`, `@blocknote/react`, `@blocknote/mantine`, `@mantine/core`, `@mantine/hooks`, and `@mantine/utils`.
- [x] Run `npm install`.
- [x] Run `npm run build --workspace packages/web`.
- [x] Commit dependency changes.

### Task 3: Add Shared Web Post Body Helpers

**Files:**

```txt
Create: packages/web/src/lib/post-body.ts
Create: packages/web/src/lib/post-body.test.ts
Modify: packages/web/src/lib/public-feed.ts
Modify: packages/web/src/lib/public-feed.test.ts
```

- [x] Move the web `PostBodyJson` types out of `public-feed.ts` and into `post-body.ts`.
- [x] Add `emptyPostBody(): PostBodyJson` returning one empty paragraph.
- [x] Add `previewPostBodyText(bodyJson)` for plain text previews.
- [x] Add `postBodyHasText(bodyJson)` for client-side save/publish enablement.
- [x] Add `normalizePostEditorDocument(bodyJson)` that preserves empty `children: []` arrays and leaves non-empty children untouched so the backend can reject nested content with `API_VALIDATION_FAILED`.
- [x] Test plain text, bold text, italic text, link text, empty paragraphs, and multiple paragraphs.
- [x] Run `npx vitest --run packages/web/src/lib/post-body.test.ts packages/web/src/lib/public-feed.test.ts`.
- [x] Commit shared post body helpers.

### Task 4: Add Browser Post API Helpers

**Files:**

```txt
Modify: packages/web/src/lib/browser-api.ts
Modify: packages/web/src/lib/browser-api.test.ts
```

- [x] Add `MemberPost`, `PostStatus`, and `PostDraftInput` types.
- [x] Add `listPosts`, `createPost`, `updatePost`, `publishPost`, and `deletePost`.
- [x] Ensure every request uses `credentials: "same-origin"`.
- [x] Ensure create/update send `content-type: application/json`.
- [x] Ensure publish sends `{ "makePublic": false }`.
- [x] Ensure delete uses `DELETE /api/posts/:id`.
- [x] Add tests for path, method, body, credentials, stable error normalization, and fetch failure.
- [x] Run `npx vitest --run packages/web/src/lib/browser-api.test.ts`.
- [x] Commit browser post API helpers.

### Task 5: Add Member Post UI State And Translations

**Files:**

```txt
Create: packages/web/src/components/member/member-posts-state.ts
Create: packages/web/src/components/member/member-posts-state.test.ts
Modify: packages/web/src/i18n/ca.ts
Modify: packages/web/src/i18n/es.ts
Modify: packages/web/src/i18n/en.ts
```

- [x] Add pure state helpers for filtering draft/published/deleted states shown in the panel.
- [x] Add `messageForPostErrorCode(code)` with English-only stable API error-code messages.
- [x] Add localized labels for loading, empty list, new draft, title, save draft, saving, publish, publishing, delete, deleting, draft status, published status, member-only visibility, saved success, published success, deleted success, login required, and member approval required.
- [x] Test state labels and error-code messages without rendering React.
- [x] Run `npx vitest --run packages/web/src/components/member/member-posts-state.test.ts packages/web/src/i18n/translations.test.ts`.
- [x] Commit state and translation changes.

### Task 6: Add Restricted BlockNote Editor Island

**Files:**

```txt
Create: packages/web/src/components/editor/PostBlockEditor.tsx
Modify: packages/web/src/styles/global.css
```

- [x] Create a BlockNote schema from scratch with only `paragraph`, `text`, `link`, `bold`, and `italic`.
- [x] Import BlockNote Mantine styles and the included Inter font inside the editor component.
- [x] Use `useCreateBlockNote({ schema, initialContent })`.
- [x] Render `BlockNoteView` with editing enabled and `onChange` forwarding `editor.document`.
- [x] Disable UI surfaces that expose unsupported features: slash menu, side menu, file panel, table handles, emoji picker.
- [x] Disable the default formatting toolbar and add a custom toolbar with only bold, italic, and link controls.
- [x] Do not configure `uploadFile`.
- [x] Add CSS for editor borders, focus, minimum height, and compact mobile layout.
- [x] Run `npm run build --workspace packages/web`.
- [x] Commit the editor island.

### Task 7: Connect The Member Posts Page

**Files:**

```txt
Create: packages/web/src/components/member/MemberPostsPanel.tsx
Modify: packages/web/src/pages/[locale]/member/posts.astro
Modify: packages/web/src/styles/global.css
```

- [x] Add a React panel that calls `getCurrentUser()` on load.
- [x] If unauthenticated, show the localized login-required state and a link to `/{locale}/login`.
- [x] If authenticated but not a member or admin, show the localized member-approval-required state.
- [x] If member/admin, call `listPosts()` and render the caller-visible post list.
- [x] Add a new draft action that initializes `title` to an empty string and `bodyJson` to `emptyPostBody()`.
- [x] Save new drafts with `createPost`.
- [x] Save existing drafts or own published posts with `updatePost`.
- [x] Publish with `publishPost`, never with `makePublic=true`.
- [x] Delete with `deletePost` and remove the deleted post from the visible list.
- [x] Disable save/publish while title is blank, body text is blank, or a request is in flight.
- [x] Preserve unsaved editor state while a save request is in flight.
- [x] Hydrate the panel from `posts.astro` using `client:load`.
- [x] Run `npm test --workspace packages/web`.
- [x] Run `npx tsc --noEmit -p packages/web/tsconfig.json`.
- [x] Run `npm run build --workspace packages/web`.
- [x] Commit member posts UI.

### Task 8: Verify Dev And Update Docs

**Files:**

```txt
Modify: design/packages/web/astro-structure.md
Modify: design/packages/web/overview.md
Modify: design/implementation/log.md
Modify: design/implementation/roadmap.md
```

- [x] Deploy with `npx sst deploy --stage dev`.
- [x] Log in as a verified accepted member through the dev Web URL.
- [x] Open `/{locale}/member/posts`.
- [x] Create a draft with two paragraphs.
- [x] Save the draft and refresh the page to confirm it reloads.
- [x] Edit the draft and save again.
- [x] Publish the post and confirm it stays member-only.
- [x] Confirm the post does not appear on the public landing page unless an admin later makes it public through API/admin tooling.
- [x] Delete the post and confirm it disappears from the member list.
- [x] Update web docs with the new member posts component structure.
- [x] Update the implementation log with commits, verification, deployment, and any BlockNote-specific decisions.
- [x] Update the roadmap so the current slice becomes `015-member-events-ui`.
- [x] Commit final docs.

## Next Slice

```txt
015-member-events-ui
```

The next slice should connect the member event list/create/edit/publish/delete workflow to the existing event APIs. Event descriptions still use Markdown until a separate event-editor decision changes that contract.
