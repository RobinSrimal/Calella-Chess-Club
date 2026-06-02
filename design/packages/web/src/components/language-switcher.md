# Component: LanguageSwitcher

## Intended File

```txt
packages/web/src/components/LanguageSwitcher.astro
```

## Purpose

Allows users to switch between Catalan, Spanish, and English.

## Behavior

```txt
set ccc_locale cookie
navigate to equivalent route in selected locale
fall back to selected locale landing page if no equivalent route exists
```
