# Component: MarkdownRenderer

## Intended File

```txt
packages/web/src/components/MarkdownRenderer.astro
```

## Purpose

Renders limited Markdown for posts and event descriptions.

## Allowed Markdown

```txt
bold
italic
links
bullet lists
numbered lists
line breaks
```

## Security

Raw HTML, images, scripts, iframes, and arbitrary styles are not allowed. Rendered HTML must be sanitized before display.
