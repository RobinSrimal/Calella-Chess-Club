# Website Design

## Purpose

`packages/web` contains the Astro website deployed with `sst.cloudflare.Astro`. It provides the public club website, auth screens, member area, and admin area.

## Public Website

The public landing page includes:

```txt
club intro
upcoming public events
public news/posts
contact/location
login/register links
```

Only posts and events marked public by an admin appear on the public landing page.

## Private Areas

Member area:

```txt
view published member posts
view published member events
create/edit/delete own posts
create/edit/delete own events
manage own drafts
```

Admin area:

```txt
view pending membership requests
approve/reject membership
disable accounts
mark published posts/events public or member-only
soft-delete published posts/events
```

Admins cannot edit member-authored content and cannot see another user's drafts.

## Internationalization

The website supports three languages:

```txt
Primary: Catalan
Secondary: Spanish
Secondary: English
Routes: /ca, /es, /en
```

Catalan is the default. Visiting `/` uses the `ccc_locale` cookie when present; otherwise it serves or redirects to Catalan.

Cookie:

```txt
name: ccc_locale
values: ca | es | en
sameSite: Lax
secure: true in production
maxAge: about 1 year
```

The public and private UI chrome is translated. Member-authored posts and events are stored once and displayed as original content across all language routes in version 1.

## API Errors

The API returns stable error codes. The website translates those codes into user-facing messages based on the current locale.

Example:

```json
{
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS"
  }
}
```

## Markdown Rendering

Posts and event descriptions support limited Markdown.

Allowed:

```txt
bold
italic
links
bullet lists
numbered lists
line breaks
```

Not allowed:

```txt
raw HTML
images
embedded scripts
iframes
arbitrary styles
```

The website renders Markdown and sanitizes the generated HTML before display.
