# ReactWeb Member Posts BlockNote UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the ReactWeb member posts workflow with a separate title field and a restricted BlockNote body editor.

**Architecture:** Keep `packages/web-react` as the active website package and reuse the existing same-origin `/api/*` proxy routes. The backend remains authoritative for authorization and BlockNote JSON validation. The posts UI treats admins as members with extra capabilities: admins can use the normal member post workflow and may explicitly publish their own draft as public, but member-only remains the default.

**Tech Stack:** React Router v7 framework mode, React 19, TypeScript, Tailwind CSS v4, BlockNote React/Mantine, existing Api Worker post routes, Vitest, SST dev deployment.

---

## References

```txt
BlockNote document structure:
https://www.blocknotejs.org/docs/foundations/document-structure

BlockNote JSON storage recommendation:
https://www.blocknotejs.org/docs/foundations/supported-formats

BlockNote custom schemas:
https://www.blocknotejs.org/docs/features/custom-schemas
```

BlockNote documents are arrays of block objects. Blocks include `type`, `props`, `content`, and `children`; inline content can include styled text and links. BlockNote recommends storing `editor.document` JSON because it is the native, durable, lossless format. Custom schemas can restrict the editor to only the block, inline, and style types we want.

## Context

The backend post contract is already JSON-based:

```txt
GET    /api/posts
POST   /api/posts
GET    /api/posts/:id
PUT    /api/posts/:id
POST   /api/posts/:id/publish
DELETE /api/posts/:id
```

Admin visibility routes exist but are not the main workflow in this slice:

```txt
POST /api/posts/:id/public
POST /api/posts/:id/member-only
```

The backend accepts restricted BlockNote-compatible `bodyJson`:

```txt
allowed block type: paragraph
allowed inline content: text and links
allowed styles: bold and italic
allowed children: [] only
rejected: uploads, media, tables, headings, lists, nested children, arbitrary styles, empty flattened text
```

This slice only builds posts. Events and admin post/event moderation screens remain out of scope.

## Role Rules

```txt
Users with membershipStatus=member can create, edit, publish, and delete their own posts.
Users with role=admin can create, edit, publish, and delete their own posts through the same member UI.
Admins are treated as members with additional capabilities, not as a separate author workflow.
Users with membershipStatus=none, pending, or rejected and role=user cannot load post controls.
The backend still performs the final member-or-admin check through requireMemberOrAdmin.
```

Admin-only addition in this posts UI:

```txt
Admins may publish their own draft as public by checking an explicit public visibility control.
The public visibility control defaults off.
Non-admin publish calls always send makePublic=false.
Member-created and admin-created posts default member-only.
```

## Route Safety Rule

Use explicit locale routes:

```txt
/ca/member/posts
/es/member/posts
/en/member/posts
```

Do not add `/:locale/member/posts`. Dynamic localized routes have already caused backend proxy collisions in this app. Explicit routes keep the page surface predictable.

## File Structure

```txt
packages/web-react/package.json
package-lock.json

packages/web-react/app/lib/locale.ts
packages/web-react/app/lib/locale.test.ts
packages/web-react/app/lib/post-body.ts
packages/web-react/app/lib/post-body.test.ts
packages/web-react/app/lib/post-api.ts
packages/web-react/app/lib/post-api.test.ts
packages/web-react/app/lib/member-posts-state.ts
packages/web-react/app/lib/member-posts-state.test.ts

packages/web-react/app/components/PostBlockEditor.tsx
packages/web-react/app/routes.ts
packages/web-react/app/routes.test.ts
packages/web-react/app/routes/home.tsx
packages/web-react/app/routes/home.test.ts
packages/web-react/app/routes/member-posts.tsx
packages/web-react/app/routes/member-posts.test.ts
packages/web-react/app/styles/tailwind.css

design/packages/web-react/overview.md
design/packages/web-react/react-router-structure.md
design/implementation/log.md
design/implementation/roadmap.md
```

## Scope

```txt
install BlockNote dependencies in packages/web-react
add explicit /{locale}/member/posts routes
add localized member posts path helper
add ReactWeb post body JSON types and plain-text preview helpers
add browser post API helpers for list/create/update/publish/delete
add a restricted BlockNote paragraph editor component
add a member posts page with /api/me access gating
support create draft, edit draft/published own post, publish draft, delete own post
show published posts visible to the caller and own drafts returned by GET /api/posts
show admin-only public publish checkbox for admins, default off
keep regular member publish calls member-only
add Catalan, Spanish, and English static UI copy
keep stable API error-code messages English-only
update active ReactWeb docs and implementation log
deploy dev and live-smoke the new route plus API proxy behavior
```

## Out Of Scope

```txt
events UI
calendar UI
admin moderation list for all posts
admin visibility toggles for other authors' posts
editing another user's post
seeing another user's drafts
uploads or images
headings, lists, quotes, tables, embeds, colors, underline, strike, nesting, or custom blocks
autosave
post revision history
comments
landing page rich BlockNote rendering
changing backend post schema
```

## UI Rules

```txt
Catalan remains the primary language.
Spanish and English remain available through the existing language switcher pattern.
Static route labels are localized.
Stable API error-code explanations stay English-only.
The page calls GET /api/me before showing post controls.
Member access means role=admin OR membershipStatus=member.
Pending/rejected/non-member users see an informational state, not the editor.
New posts always start as drafts.
Drafts are only visible to the creator because the backend enforces this.
The title is a separate required field, not a BlockNote heading.
The BlockNote body starts from one paragraph block.
Save draft and publish are explicit buttons.
Publishing as public is only visible to admins and defaults off.
Delete uses the existing soft-delete API action.
All unsafe calls send content-type application/json and a JSON body.
```

## API Contract

```ts
export type PostStatus = "draft" | "published" | "deleted";

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
  content: string | Array<PostInlineText | PostInlineLink>;
  children?: [];
};

export type PostBodyJson = PostBodyBlock[];

export type MemberPost = {
  id: string;
  authorId: string;
  authorUsername: string;
  title: string;
  bodyJson: PostBodyJson;
  status: PostStatus;
  isPublic: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  deletedBy: string | null;
};
```

Browser helpers:

```ts
listPosts(): Promise<ApiResult<{ posts: MemberPost[] }>>;
createPost(input: { title: string; bodyJson: PostBodyJson }): Promise<ApiResult<{ post: MemberPost }>>;
updatePost(id: string, input: { title: string; bodyJson: PostBodyJson }): Promise<ApiResult<{ post: MemberPost }>>;
publishPost(id: string, input?: { makePublic?: boolean }): Promise<ApiResult<{ post: MemberPost }>>;
deletePost(id: string): Promise<ApiResult<{ post: MemberPost }>>;
```

`publishPost` sends `{ "makePublic": false }` unless the caller explicitly passes `makePublic: true`.

## Tasks

### Task 1: Add Route And Locale Helpers

**Files:**

```txt
Modify: packages/web-react/app/lib/locale.ts
Modify: packages/web-react/app/lib/locale.test.ts
Modify: packages/web-react/app/routes.ts
Modify: packages/web-react/app/routes.test.ts
Modify: packages/web-react/app/routes/home.tsx
Modify: packages/web-react/app/routes/home.test.ts
```

- [ ] Add `memberPostsPath(locale)` returning `/${locale}/member/posts`.
- [ ] Add locale tests for `memberPostsPath("ca")`, `"es"`, and `"en"`.
- [ ] Add explicit route definitions:

```ts
route("ca/member/posts", "routes/member-posts.tsx", { id: "member-posts-ca" });
route("es/member/posts", "routes/member-posts.tsx", { id: "member-posts-es" });
route("en/member/posts", "routes/member-posts.tsx", { id: "member-posts-en" });
```

- [ ] Extend `routes.test.ts` to require the three explicit member posts routes and forbid `route(":locale/member/posts"`.
- [ ] Add a member shell CTA in `home.tsx` that links to `memberPostsPath(locale)` when `section === "member"`.
- [ ] Add a home route test that expects Catalan member shell copy `Escriure posts`.
- [ ] Run:

```bash
npm test --workspace @CCC/web-react
```

Expected: route/locale/home tests pass after the helper and routes are added.

### Task 2: Install BlockNote Dependencies

**Files:**

```txt
Modify: packages/web-react/package.json
Modify: package-lock.json
```

- [ ] Add dependencies:

```txt
@blocknote/core
@blocknote/react
@blocknote/mantine
@mantine/core
@mantine/hooks
@mantine/utils
```

- [ ] Run:

```bash
npm install
npm run build --workspace @CCC/web-react
```

Expected: install succeeds and ReactWeb still builds.

### Task 3: Add Post Body Helpers

**Files:**

```txt
Create: packages/web-react/app/lib/post-body.ts
Create: packages/web-react/app/lib/post-body.test.ts
```

- [ ] Add the `PostBodyJson` types from the API contract.
- [ ] Add `emptyPostBody(): PostBodyJson` returning one empty paragraph:

```ts
[
  {
    type: "paragraph",
    props: {
      backgroundColor: "default",
      textColor: "default",
      textAlignment: "left",
    },
    content: "",
    children: [],
  },
]
```

- [ ] Add `previewPostBodyText(bodyJson)` that flattens text and link text into a short plain-text preview.
- [ ] Add `postBodyHasText(bodyJson)` that returns true when flattened non-whitespace text exists.
- [ ] Add `normalizePostEditorDocument(bodyJson)` that keeps paragraph blocks, default paragraph props, text/link inline content, bold/italic styles, and empty `children: []`.
- [ ] Do not silently convert or drop headings/lists/media. Preserve unsupported block objects in the submitted document so the backend remains the final validator and rejects them with `API_VALIDATION_FAILED`.
- [ ] Test plain text, bold text, italic text, link text, multiple paragraphs, empty paragraphs, and empty children.
- [ ] Run:

```bash
npx vitest --run packages/web-react/app/lib/post-body.test.ts --config packages/web-react/vitest.config.ts
```

Expected: post body helper tests pass.

### Task 4: Add Browser Post API Helpers

**Files:**

```txt
Modify: packages/web-react/app/lib/account-api.ts
Modify: packages/web-react/app/lib/account-api.test.ts
Create: packages/web-react/app/lib/post-api.ts
Create: packages/web-react/app/lib/post-api.test.ts
```

- [ ] Export the existing `ApiResult` type or move shared API result/fetch handling into a reusable helper without changing current admin/auth behavior.
- [ ] Add `MemberPost`, `PostStatus`, and `PostDraftInput` types.
- [ ] Implement:

```ts
listPosts()
createPost({ title, bodyJson })
updatePost(id, { title, bodyJson })
publishPost(id, { makePublic = false })
deletePost(id)
```

- [ ] Ensure create/update send JSON with `title` and `bodyJson`.
- [ ] Ensure publish sends JSON with `makePublic`.
- [ ] Ensure delete sends a bodyless `DELETE` request, matching the current ReactWeb proxy behavior.
- [ ] Normalize stable error-code responses using the same `ApiResult` shape as account/admin helpers.
- [ ] Test methods, paths, JSON bodies, `credentials: "same-origin"`, stable errors, and network errors.
- [ ] Run:

```bash
npx vitest --run packages/web-react/app/lib/post-api.test.ts packages/web-react/app/lib/account-api.test.ts --config packages/web-react/vitest.config.ts
```

Expected: post API helper tests and existing account API tests pass.

### Task 5: Add Member Post State Helpers

**Files:**

```txt
Create: packages/web-react/app/lib/member-posts-state.ts
Create: packages/web-react/app/lib/member-posts-state.test.ts
```

- [ ] Add `canUseMemberPosts(user)` returning true when:

```ts
user.role === "admin" || user.membershipStatus === "member"
```

- [ ] Add `sortMemberPosts(posts)` ordering drafts first by `updatedAt`, then published posts by `publishedAt` or `updatedAt`.
- [ ] Add `canEditPost(post, currentUser)` true only for own non-deleted posts.
- [ ] Add `canDeletePost(post, currentUser)` true for own non-deleted posts; admin deletion of other published posts is out of scope for this member page.
- [ ] Add `messageForPostErrorCode(code)` with English-only messages for:

```txt
API_AUTH_REQUIRED
API_AUTH_INVALID
API_FORBIDDEN
API_POST_NOT_FOUND
API_VALIDATION_FAILED
NETWORK_ERROR
```

- [ ] Test admin access, member access, pending user denial, sorting, edit/delete visibility, and error messages.
- [ ] Run:

```bash
npx vitest --run packages/web-react/app/lib/member-posts-state.test.ts --config packages/web-react/vitest.config.ts
```

Expected: member post state helper tests pass.

### Task 6: Add Restricted BlockNote Editor Component

**Files:**

```txt
Create: packages/web-react/app/components/PostBlockEditor.tsx
Modify: packages/web-react/app/root.tsx
```

- [ ] Import BlockNote styles in a package-level route-safe place:

```ts
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
```

- [ ] Create a paragraph-only schema:

```ts
import { BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs, defaultStyleSpecs } from "@blocknote/core";

const postSchema = BlockNoteSchema.create({
  blockSpecs: {
    paragraph: defaultBlockSpecs.paragraph,
  },
  inlineContentSpecs: {
    text: defaultInlineContentSpecs.text,
    link: defaultInlineContentSpecs.link,
  },
  styleSpecs: {
    bold: defaultStyleSpecs.bold,
    italic: defaultStyleSpecs.italic,
  },
});
```

- [ ] Use `useCreateBlockNote({ schema: postSchema, initialContent })`.
- [ ] Render `<BlockNoteView editor={editor} onChange={...} />`.
- [ ] Pass `editor.document` through `normalizePostEditorDocument` before calling `onChange`.
- [ ] Keep `title` outside this component.
- [ ] Keep uploads disabled by schema; do not add upload handlers.
- [ ] Run:

```bash
npm run typecheck --workspace @CCC/web-react
npm run build --workspace @CCC/web-react
```

Expected: ReactWeb typecheck/build pass with BlockNote installed.

### Task 7: Add Member Posts Page

**Files:**

```txt
Create: packages/web-react/app/routes/member-posts.tsx
Create: packages/web-react/app/routes/member-posts.test.ts
Modify: packages/web-react/app/styles/tailwind.css
```

- [ ] Add a loader that derives locale from `localeFromPathname(new URL(request.url).pathname)` and returns localized copy.
- [ ] Add route tests for Catalan copy and `canUseMemberPosts` integration expectations.
- [ ] On mount, call `getCurrentUser()`.
- [ ] Show login-required state for `API_AUTH_REQUIRED` or `API_AUTH_INVALID`.
- [ ] Show a non-member informational state when `canUseMemberPosts(user)` is false.
- [ ] Load posts with `listPosts()` after access is confirmed.
- [ ] Render list states:

```txt
loading current user
loading posts
empty posts
draft posts
published posts
stable API error-code message
```

- [ ] Add editor state:

```txt
selected post id or new draft mode
title
bodyJson
isDirty
isSaving
isPublishing
isDeleting
adminMakePublic boolean
```

- [ ] Add actions:

```txt
New draft: clears title/body to empty draft state
Save draft: POST /api/posts for new draft or PUT /api/posts/:id for existing post
Publish: POST /api/posts/:id/publish with makePublic=false for members
Publish as public: admins only, checkbox default false
Delete: DELETE /api/posts/:id
```

- [ ] After create/update/publish/delete, replace the changed row from the API response and keep sorting stable.
- [ ] Never optimistically publish/delete before API success.
- [ ] Add localized copy for title label, body label, new draft, save draft, publish, publish publicly, delete, empty, login required, non-member state, and status badges.
- [ ] Run:

```bash
npm test --workspace @CCC/web-react
npm run typecheck --workspace @CCC/web-react
npm run build --workspace @CCC/web-react
```

Expected: tests, typecheck, and build pass.

### Task 8: Update Docs

**Files:**

```txt
Modify: design/packages/web-react/overview.md
Modify: design/packages/web-react/react-router-structure.md
Modify: design/implementation/roadmap.md
Modify: design/implementation/log.md
```

- [ ] Update active ReactWeb docs to include:

```txt
/{ca|es|en}/member/posts
```

- [ ] Document that posts use a separate title field plus restricted BlockNote body JSON.
- [ ] Document that admins can use the member posts UI and may explicitly publish their own draft publicly, default off.
- [ ] Move roadmap current slice to the next desired slice:

```txt
019-reactweb-events-ui
```

- [ ] Add an implementation log entry after the implementation commit with verification and live smoke results.

### Task 9: Deploy And Live Smoke

**Files:**

```txt
No code files beyond Task 8.
```

- [ ] Deploy:

```bash
npx sst deploy --stage dev
```

Expected: `ReactWebUrl` remains `https://ccc-dev-reactwebworkerscript.robin-srimal.workers.dev`.

- [ ] Live route smoke:

```bash
node --input-type=module -e "const base='https://ccc-dev-reactwebworkerscript.robin-srimal.workers.dev'; const paths=['/ca/member/posts','/api/posts']; for (const path of paths) { const res=await fetch(base+path,{redirect:'manual'}); const text=await res.text(); console.log(path,res.status,res.headers.get('content-type'),text.slice(0,180).replace(/\\s+/g,' ')); }"
```

Expected:

```txt
/ca/member/posts returns 200 HTML
/api/posts returns 401 JSON API_AUTH_REQUIRED when logged out
```

- [ ] If an email-verified admin test account is available, manually check:

```txt
log in as admin
open /ca/member/posts
create a draft with title and paragraph body
save draft
publish without public checkbox and confirm member-only
create another draft
publish with public checkbox and confirm public
delete disposable posts
```

- [ ] If a verified member test account is available, manually check:

```txt
log in as member
open /ca/member/posts
create a draft with title and paragraph body
confirm no public checkbox is visible
publish and confirm member-only
delete disposable post
```

## Completion Criteria

```txt
ReactWeb exposes /{locale}/member/posts
members and admins can use the member posts workflow
non-members cannot see post controls
title is separate from the BlockNote body
BlockNote editor stores/sends editor.document-style JSON
backend remains final validator for restricted paragraph JSON
drafts remain creator-only
publish defaults member-only
admin public publish is explicit and default off
tests, typecheck, build, dev deploy, and live smoke are recorded
events remain intentionally planned for a later slice
```
