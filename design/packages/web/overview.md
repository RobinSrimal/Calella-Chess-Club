# Web Package Overview

## Purpose

`packages/web` contains the Astro website. It provides the public landing page, auth screens, member area, and admin area.

## Astro Structure

```txt
packages/web/
  astro.config.mjs
  package.json
  tsconfig.json
  public/
  src/
    pages/
    layouts/
    components/
    styles/
    lib/
    i18n/
```

Astro routes are created from files in `src/pages`. Shared page shells live in `src/layouts`. Reusable UI lives in `src/components`.

## Language Strategy

```txt
Primary: Catalan
Secondary: Spanish
Secondary: English
Routes: /ca, /es, /en
Cookie: ccc_locale
```

UI chrome is translated. Member-authored post and event content is stored once and displayed as original content in all locales for version 1.
