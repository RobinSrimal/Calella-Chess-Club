# Route: /[locale]/member/posts

## Intended File

```txt
packages/web/src/pages/[locale]/member/posts.astro
```

## Purpose

Member post list and authoring entry point.

## Features

```txt
view published member posts
view own drafts
create draft
edit own draft or published post
publish own draft
soft-delete own post
```

Drafts are visible only to their creator.

When the current user is an admin, the publish flow includes an unchecked "make public immediately" control. If left unchecked, the post is published for members only. Non-admin users never see this control.
