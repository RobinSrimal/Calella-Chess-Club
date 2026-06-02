# Web Astro Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `packages/web` as an Astro 6 site deployed through SST/Cloudflare, with locale-aware public, auth, member, and admin route shells.

**Architecture:** `packages/web` owns the Astro app. The root route reads the `ccc_locale` cookie and redirects to `/ca`, `/es`, or `/en`; localized routes set the same cookie when visited. `infra/web.ts` creates one SST `sst.cloudflare.Astro` site named `Web`, links it to the existing `Api` and `AuthApi` Workers for future API use, and `sst.config.ts` exposes `WebUrl`.

**Tech Stack:** Astro 6, `@astrojs/cloudflare` v13, TypeScript, Vitest, SST `sst.cloudflare.Astro`, Cloudflare Workers runtime.

---

## External References

```txt
SST Cloudflare Astro component:
https://sst.dev/docs/component/cloudflare/astro/

Astro project structure:
https://docs.astro.build/en/basics/project-structure/

Astro pages and file-based routing:
https://docs.astro.build/en/basics/astro-pages/

Astro Cloudflare adapter:
https://docs.astro.build/en/guides/integrations-guide/cloudflare/
```

## File Structure

```txt
packages/web/package.json
  Web package manifest with Astro build, dev, preview, and Vitest scripts.

packages/web/astro.config.mjs
  Astro Cloudflare adapter config for SST.

packages/web/tsconfig.json
  Astro TypeScript config.

packages/web/src/env.d.ts
  Astro client type reference.

packages/web/src/lib/locale.ts
packages/web/src/lib/locale.test.ts
  Locale values, cookie helpers, route helper tests, and implementation.

packages/web/src/i18n/ca.ts
packages/web/src/i18n/es.ts
packages/web/src/i18n/en.ts
packages/web/src/i18n/index.ts
packages/web/src/i18n/translations.test.ts
  UI dictionaries and dictionary parity tests.

packages/web/src/styles/global.css
  Shared site styling.

packages/web/src/components/LanguageSwitcher.astro
packages/web/src/components/PageIntro.astro
  Shared visual components.

packages/web/src/layouts/PublicLayout.astro
packages/web/src/layouts/AppLayout.astro
packages/web/src/layouts/AdminLayout.astro
  Public, member, and admin page shells.

packages/web/public/images/club-hero.png
  Generated bitmap hero image for the landing page.

packages/web/src/pages/index.astro
packages/web/src/pages/[locale]/index.astro
packages/web/src/pages/[locale]/login.astro
packages/web/src/pages/[locale]/register.astro
packages/web/src/pages/[locale]/verify-email.astro
packages/web/src/pages/[locale]/forgot-password.astro
packages/web/src/pages/[locale]/reset-password.astro
packages/web/src/pages/[locale]/member/index.astro
packages/web/src/pages/[locale]/member/posts.astro
packages/web/src/pages/[locale]/member/events.astro
packages/web/src/pages/[locale]/admin/index.astro
packages/web/src/pages/[locale]/admin/users.astro
packages/web/src/pages/[locale]/admin/posts.astro
packages/web/src/pages/[locale]/admin/events.astro
  Root redirect and localized static route shells.

infra/web.ts
  SST Cloudflare Astro resource.

sst.config.ts
  Returns `WebUrl`.

sst-env.d.ts
packages/*/sst-env.d.ts
  SST-generated resource type files if `sst diff` or `sst deploy` updates them.

design/implementation/log.md
  Updated after the slice is completed.

design/implementation/roadmap.md
  Updated after the slice is completed to name the next candidate slice.
```

## Out Of Scope

```txt
real login
registration submission
email verification behavior
password reset behavior
session detection
member data loading
admin data loading
posts and events CRUD
Markdown rendering
API calls
custom domains
production stage
```

### Task 1: Add Web Package Scaffold

**Files:**
- Create: `packages/web/package.json`
- Create: `packages/web/astro.config.mjs`
- Create: `packages/web/tsconfig.json`
- Create: `packages/web/src/env.d.ts`
- Modify: `package-lock.json`

- [ ] **Step 1: Create the web package manifest**

Create `packages/web/package.json`:

```json
{
  "name": "@CCC/web",
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest --run"
  },
  "dependencies": {
    "@astrojs/cloudflare": "^13.6.1",
    "astro": "^6.4.2",
    "sst": "*"
  },
  "devDependencies": {
    "vitest": "^2"
  }
}
```

- [ ] **Step 2: Create the Astro config**

Create `packages/web/astro.config.mjs`:

```js
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",
  adapter: cloudflare({
    configPath: process.env.SST_WRANGLER_PATH,
    imageService: "compile",
  }),
});
```

The `configPath` setting is required for SST to provide the generated Wrangler config. `imageService: "compile"` keeps this shell from provisioning a Cloudflare Images binding.

- [ ] **Step 3: Create the TypeScript config**

Create `packages/web/tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": "."
  }
}
```

- [ ] **Step 4: Create the Astro env type reference**

Create `packages/web/src/env.d.ts`:

```ts
/// <reference types="astro/client" />
```

- [ ] **Step 5: Update the root package lock**

Run:

```bash
npm install --package-lock-only
```

Expected result:

```txt
exit code 0
package-lock.json includes the @CCC/web workspace and Astro dependencies
```

- [ ] **Step 6: Verify the package scaffold is visible to npm**

Run:

```bash
npm run build --workspace packages/web
```

Expected result:

```txt
The command fails because packages/web/src/pages does not exist yet.
```

The failure confirms the package is wired into npm. Page files are added in later tasks.

- [ ] **Step 7: Commit the web package scaffold**

Run:

```bash
git add package-lock.json packages/web/package.json packages/web/astro.config.mjs packages/web/tsconfig.json packages/web/src/env.d.ts
git commit -m "Add web Astro package scaffold"
```

Expected result: commit succeeds and includes only the files listed above.

### Task 2: Add Locale Helpers With Red Tests

**Files:**
- Create: `packages/web/src/lib/locale.test.ts`
- Create: `packages/web/src/lib/locale.ts`

- [ ] **Step 1: Write failing locale helper tests**

Create `packages/web/src/lib/locale.test.ts`:

```ts
import { expect, test } from "vitest";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALES,
  getLocaleFromParam,
  isLocale,
  localizedPathFor,
  readLocaleCookie,
} from "./locale";

test("defines Catalan as the default locale", () => {
  expect(DEFAULT_LOCALE).toBe("ca");
  expect(LOCALE_COOKIE).toBe("ccc_locale");
  expect(LOCALES).toEqual(["ca", "es", "en"]);
});

test("validates supported locale values", () => {
  expect(isLocale("ca")).toBe(true);
  expect(isLocale("es")).toBe(true);
  expect(isLocale("en")).toBe(true);
  expect(isLocale("fr")).toBe(false);
  expect(isLocale(undefined)).toBe(false);
});

test("parses route parameters", () => {
  expect(getLocaleFromParam("ca")).toBe("ca");
  expect(getLocaleFromParam("es")).toBe("es");
  expect(getLocaleFromParam("en")).toBe("en");
  expect(getLocaleFromParam("de")).toBeUndefined();
  expect(getLocaleFromParam(undefined)).toBeUndefined();
});

test("reads locale cookie values", () => {
  const cookies = {
    get(name: string) {
      return name === "ccc_locale" ? { value: "es" } : undefined;
    },
  };

  expect(readLocaleCookie(cookies)).toBe("es");
});

test("ignores unsupported locale cookie values", () => {
  const cookies = {
    get() {
      return { value: "fr" };
    },
  };

  expect(readLocaleCookie(cookies)).toBeUndefined();
});

test("builds equivalent localized paths", () => {
  expect(localizedPathFor("/ca/member/posts", "es")).toBe("/es/member/posts");
  expect(localizedPathFor("/member/posts", "en")).toBe("/en/member/posts");
  expect(localizedPathFor("/", "ca")).toBe("/ca");
});
```

- [ ] **Step 2: Run the locale tests and verify they fail for the expected reason**

Run:

```bash
npm test --workspace packages/web
```

Expected result:

```txt
FAIL src/lib/locale.test.ts
Failed to load url ./locale
```

The exact Vitest wording can differ, but the failure must be caused by missing `packages/web/src/lib/locale.ts`.

- [ ] **Step 3: Implement the locale helper module**

Create `packages/web/src/lib/locale.ts`:

```ts
export const LOCALES = ["ca", "es", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ca";
export const LOCALE_COOKIE = "ccc_locale";

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

type CookieWriter = {
  set(
    name: string,
    value: string,
    options: {
      httpOnly: boolean;
      maxAge: number;
      path: string;
      sameSite: "lax";
      secure: boolean;
    },
  ): void;
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALES.includes(value as Locale);
}

export function getLocaleFromParam(value: string | undefined): Locale | undefined {
  return isLocale(value) ? value : undefined;
}

export function readLocaleCookie(cookies: CookieReader): Locale | undefined {
  const value = cookies.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : undefined;
}

export function writeLocaleCookie(cookies: CookieWriter, locale: Locale) {
  cookies.set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: true,
  });
}

export function localizedPathFor(pathname: string, targetLocale: Locale) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length > 0 && isLocale(segments[0])) {
    segments[0] = targetLocale;
    return `/${segments.join("/")}`;
  }

  return `/${[targetLocale, ...segments].join("/")}`;
}
```

- [ ] **Step 4: Run the web tests**

Run:

```bash
npm test --workspace packages/web
```

Expected result:

```txt
6 tests passed
```

- [ ] **Step 5: Commit the locale helpers**

Run:

```bash
git add packages/web/src/lib/locale.test.ts packages/web/src/lib/locale.ts
git commit -m "Add web locale helpers"
```

Expected result: commit succeeds and includes only the two locale files.

### Task 3: Add I18n Dictionaries With Parity Tests

**Files:**
- Create: `packages/web/src/i18n/translations.test.ts`
- Create: `packages/web/src/i18n/ca.ts`
- Create: `packages/web/src/i18n/es.ts`
- Create: `packages/web/src/i18n/en.ts`
- Create: `packages/web/src/i18n/index.ts`

- [ ] **Step 1: Write failing dictionary parity tests**

Create `packages/web/src/i18n/translations.test.ts`:

```ts
import { expect, test } from "vitest";
import { ca } from "./ca";
import { en } from "./en";
import { es } from "./es";
import { getTranslations } from ".";

function keysOf(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return keysOf(child, path);
  });
}

test("Spanish and English dictionaries match Catalan keys", () => {
  const catalanKeys = keysOf(ca).sort();

  expect(keysOf(es).sort()).toEqual(catalanKeys);
  expect(keysOf(en).sort()).toEqual(catalanKeys);
});

test("returns translations by locale", () => {
  expect(getTranslations("ca").site.name).toBe("Club d'Escacs Calella");
  expect(getTranslations("es").nav.login).toBe("Iniciar sesion");
  expect(getTranslations("en").nav.login).toBe("Log in");
});
```

- [ ] **Step 2: Run the i18n tests and verify they fail for the expected reason**

Run:

```bash
npm test --workspace packages/web
```

Expected result:

```txt
FAIL src/i18n/translations.test.ts
Failed to load url ./ca
```

The exact Vitest wording can differ, but the failure must be caused by missing dictionary files.

- [ ] **Step 3: Add the Catalan dictionary**

Create `packages/web/src/i18n/ca.ts`:

```ts
export const ca = {
  site: {
    name: "Club d'Escacs Calella",
    description: "Escacs, activitats i comunitat a Calella.",
  },
  language: {
    label: "Idioma",
    ca: "Catala",
    es: "Castella",
    en: "Angles",
  },
  nav: {
    home: "Inici",
    login: "Entrar",
    register: "Registrar-se",
    member: "Socis",
    admin: "Admin",
    posts: "Publicacions",
    events: "Calendari",
    users: "Usuaris",
    logout: "Sortir",
  },
  landing: {
    title: "Club d'Escacs Calella",
    subtitle: "Un espai tranquil per jugar, aprendre i compartir escacs.",
    primaryAction: "Entrar",
    secondaryAction: "Registrar-se",
    postsTitle: "Publicacions del club",
    postsEmpty: "Encara no hi ha publicacions publiques.",
    eventsTitle: "Calendari",
    eventsEmpty: "Encara no hi ha activitats publiques.",
  },
  auth: {
    loginTitle: "Entrar al compte",
    registerTitle: "Crear un compte",
    verifyTitle: "Verificar el correu",
    forgotTitle: "Recuperar la contrasenya",
    resetTitle: "Definir una contrasenya nova",
    username: "Nom d'usuari",
    email: "Correu electronic",
    password: "Contrasenya",
    submitLogin: "Entrar",
    submitRegister: "Registrar-se",
    submitForgot: "Enviar enllac",
    submitReset: "Canviar contrasenya",
  },
  member: {
    dashboardTitle: "Zona de socis",
    dashboardSummary: "Publicacions i activitats dels socis.",
    postsTitle: "Les meves publicacions",
    eventsTitle: "Els meus esdeveniments",
    draftStatus: "Esborrany",
  },
  admin: {
    dashboardTitle: "Administracio",
    dashboardSummary: "Gestio de socis, publicacions i calendari.",
    usersTitle: "Usuaris",
    postsTitle: "Publicacions",
    eventsTitle: "Esdeveniments",
  },
} as const;
```

- [ ] **Step 4: Add the Spanish dictionary**

Create `packages/web/src/i18n/es.ts`:

```ts
export const es = {
  site: {
    name: "Club de Ajedrez Calella",
    description: "Ajedrez, actividades y comunidad en Calella.",
  },
  language: {
    label: "Idioma",
    ca: "Catalan",
    es: "Castellano",
    en: "Ingles",
  },
  nav: {
    home: "Inicio",
    login: "Iniciar sesion",
    register: "Registrarse",
    member: "Socios",
    admin: "Admin",
    posts: "Publicaciones",
    events: "Calendario",
    users: "Usuarios",
    logout: "Salir",
  },
  landing: {
    title: "Club de Ajedrez Calella",
    subtitle: "Un espacio tranquilo para jugar, aprender y compartir ajedrez.",
    primaryAction: "Iniciar sesion",
    secondaryAction: "Registrarse",
    postsTitle: "Publicaciones del club",
    postsEmpty: "Todavia no hay publicaciones publicas.",
    eventsTitle: "Calendario",
    eventsEmpty: "Todavia no hay actividades publicas.",
  },
  auth: {
    loginTitle: "Iniciar sesion",
    registerTitle: "Crear una cuenta",
    verifyTitle: "Verificar el correo",
    forgotTitle: "Recuperar la contrasena",
    resetTitle: "Definir una contrasena nueva",
    username: "Nombre de usuario",
    email: "Correo electronico",
    password: "Contrasena",
    submitLogin: "Entrar",
    submitRegister: "Registrarse",
    submitForgot: "Enviar enlace",
    submitReset: "Cambiar contrasena",
  },
  member: {
    dashboardTitle: "Zona de socios",
    dashboardSummary: "Publicaciones y actividades de los socios.",
    postsTitle: "Mis publicaciones",
    eventsTitle: "Mis eventos",
    draftStatus: "Borrador",
  },
  admin: {
    dashboardTitle: "Administracion",
    dashboardSummary: "Gestion de socios, publicaciones y calendario.",
    usersTitle: "Usuarios",
    postsTitle: "Publicaciones",
    eventsTitle: "Eventos",
  },
} as const;
```

- [ ] **Step 5: Add the English dictionary**

Create `packages/web/src/i18n/en.ts`:

```ts
export const en = {
  site: {
    name: "Calella Chess Club",
    description: "Chess, activities, and community in Calella.",
  },
  language: {
    label: "Language",
    ca: "Catalan",
    es: "Spanish",
    en: "English",
  },
  nav: {
    home: "Home",
    login: "Log in",
    register: "Register",
    member: "Members",
    admin: "Admin",
    posts: "Posts",
    events: "Calendar",
    users: "Users",
    logout: "Log out",
  },
  landing: {
    title: "Calella Chess Club",
    subtitle: "A quiet place to play, learn, and share chess.",
    primaryAction: "Log in",
    secondaryAction: "Register",
    postsTitle: "Club posts",
    postsEmpty: "There are no public posts yet.",
    eventsTitle: "Calendar",
    eventsEmpty: "There are no public activities yet.",
  },
  auth: {
    loginTitle: "Log in",
    registerTitle: "Create an account",
    verifyTitle: "Verify email",
    forgotTitle: "Recover password",
    resetTitle: "Set a new password",
    username: "Username",
    email: "Email",
    password: "Password",
    submitLogin: "Log in",
    submitRegister: "Register",
    submitForgot: "Send link",
    submitReset: "Change password",
  },
  member: {
    dashboardTitle: "Member area",
    dashboardSummary: "Member posts and activities.",
    postsTitle: "My posts",
    eventsTitle: "My events",
    draftStatus: "Draft",
  },
  admin: {
    dashboardTitle: "Administration",
    dashboardSummary: "Manage members, posts, and calendar entries.",
    usersTitle: "Users",
    postsTitle: "Posts",
    eventsTitle: "Events",
  },
} as const;
```

- [ ] **Step 6: Add the dictionary entry point**

Create `packages/web/src/i18n/index.ts`:

```ts
import type { Locale } from "../lib/locale";
import { ca } from "./ca";
import { en } from "./en";
import { es } from "./es";

export const dictionaries = {
  ca,
  es,
  en,
} as const;

export type Translations = (typeof dictionaries)[Locale];

export function getTranslations(locale: Locale): Translations {
  return dictionaries[locale];
}
```

- [ ] **Step 7: Run the web tests**

Run:

```bash
npm test --workspace packages/web
```

Expected result:

```txt
8 tests passed
```

- [ ] **Step 8: Commit the dictionaries**

Run:

```bash
git add packages/web/src/i18n/translations.test.ts packages/web/src/i18n/ca.ts packages/web/src/i18n/es.ts packages/web/src/i18n/en.ts packages/web/src/i18n/index.ts
git commit -m "Add web i18n dictionaries"
```

Expected result: commit succeeds and includes only the dictionary files and dictionary test.

### Task 4: Add Layouts, Components, Styles, And Visual Asset

**Files:**
- Create: `packages/web/public/images/club-hero.png`
- Create: `packages/web/src/styles/global.css`
- Create: `packages/web/src/components/LanguageSwitcher.astro`
- Create: `packages/web/src/components/PageIntro.astro`
- Create: `packages/web/src/layouts/PublicLayout.astro`
- Create: `packages/web/src/layouts/AppLayout.astro`
- Create: `packages/web/src/layouts/AdminLayout.astro`

- [ ] **Step 1: Generate the landing-page bitmap asset**

Use image generation to create `packages/web/public/images/club-hero.png` with this prompt:

```txt
A documentary-style horizontal photograph of a small Catalan chess club room near the coast, wooden chess boards on tables, a few empty chairs, soft daylight, calm community atmosphere, no readable text, no people in focus, natural colors, realistic, 1600 by 900.
```

Expected result:

```txt
packages/web/public/images/club-hero.png exists and is a bitmap image.
```

- [ ] **Step 2: Add global styles**

Create `packages/web/src/styles/global.css`:

```css
:root {
  color-scheme: light;
  --ink: #202020;
  --muted: #5d6470;
  --line: #d9dde3;
  --surface: #ffffff;
  --surface-soft: #f4f6f8;
  --accent: #0f766e;
  --accent-strong: #115e59;
  --focus: #2563eb;
  --danger: #b91c1c;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

* {
  box-sizing: border-box;
}

html {
  min-height: 100%;
  background: var(--surface);
  color: var(--ink);
}

body {
  min-height: 100%;
  margin: 0;
}

a {
  color: inherit;
}

button,
input {
  font: inherit;
}

.site-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.site-header,
.site-footer {
  border-color: var(--line);
  background: rgba(255, 255, 255, 0.96);
}

.site-header {
  border-bottom: 1px solid var(--line);
  position: sticky;
  top: 0;
  z-index: 10;
}

.site-footer {
  border-top: 1px solid var(--line);
}

.shell-inner {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
}

.topbar {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  font-weight: 700;
}

.brand-mark {
  width: 28px;
  height: 28px;
  border: 1px solid var(--ink);
  background:
    linear-gradient(45deg, #111 25%, transparent 25%),
    linear-gradient(-45deg, #111 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #111 75%),
    linear-gradient(-45deg, transparent 75%, #111 75%);
  background-color: #fff;
  background-position:
    0 0,
    0 14px,
    14px -14px,
    -14px 0;
  background-size: 28px 28px;
}

.nav-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.nav-row a,
.language-switcher a,
.button-link {
  border-radius: 6px;
  text-decoration: none;
}

.nav-row a {
  color: var(--muted);
  font-size: 0.95rem;
}

.nav-row a:hover,
.language-switcher a:hover {
  color: var(--ink);
}

.language-switcher {
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: 8px;
}

.language-switcher a {
  padding: 4px 8px;
  color: var(--muted);
  font-size: 0.85rem;
}

.language-switcher a[aria-current="true"] {
  background: var(--ink);
  color: #fff;
}

.main-content {
  flex: 1;
}

.hero {
  min-height: min(620px, calc(100vh - 96px));
  display: grid;
  align-items: end;
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.72)),
    url("/images/club-hero.png") center / cover;
  color: #fff;
}

.hero-content {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
  padding: 96px 0 56px;
}

.hero h1 {
  max-width: 760px;
  margin: 0;
  font-size: clamp(2.5rem, 7vw, 5.2rem);
  line-height: 1;
  letter-spacing: 0;
}

.hero p {
  max-width: 620px;
  margin: 20px 0 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  line-height: 1.55;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 28px;
}

.button-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid transparent;
  background: var(--accent);
  color: #fff;
  font-weight: 700;
}

.button-link.secondary {
  border-color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.12);
}

.section-band {
  padding: 44px 0;
}

.section-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.panel,
.form-panel {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
}

.panel {
  padding: 22px;
}

.panel h2,
.panel h3,
.form-panel h1 {
  margin: 0;
  font-size: 1.25rem;
}

.panel p,
.page-intro p {
  color: var(--muted);
  line-height: 1.55;
}

.page-intro {
  padding: 42px 0 22px;
}

.page-intro h1 {
  margin: 0;
  font-size: 2rem;
  letter-spacing: 0;
}

.content-stack {
  display: grid;
  gap: 18px;
  padding-bottom: 48px;
}

.form-panel {
  width: min(480px, 100%);
  margin: 42px auto;
  padding: 24px;
}

.field-stack {
  display: grid;
  gap: 14px;
  margin-top: 20px;
}

.field-stack label {
  display: grid;
  gap: 6px;
  color: var(--muted);
  font-size: 0.9rem;
}

.field-stack input {
  min-height: 42px;
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 0 10px;
  color: var(--ink);
}

.field-stack input:focus {
  border-color: var(--focus);
  outline: 2px solid color-mix(in srgb, var(--focus) 20%, transparent);
}

.footer-content {
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  color: var(--muted);
  font-size: 0.9rem;
}

@media (max-width: 760px) {
  .topbar,
  .footer-content {
    align-items: flex-start;
    flex-direction: column;
    padding: 14px 0;
  }

  .section-grid {
    grid-template-columns: 1fr;
  }

  .hero-content {
    padding-top: 72px;
  }
}
```

- [ ] **Step 3: Add the language switcher component**

Create `packages/web/src/components/LanguageSwitcher.astro`:

```astro
---
import { getTranslations } from "../i18n";
import { LOCALES, localizedPathFor, type Locale } from "../lib/locale";

interface Props {
  locale: Locale;
  currentPath: string;
}

const { locale, currentPath } = Astro.props;
const t = getTranslations(locale);
---

<nav class="language-switcher" aria-label={t.language.label}>
  {
    LOCALES.map((targetLocale) => (
      <a
        href={localizedPathFor(currentPath, targetLocale)}
        hreflang={targetLocale}
        aria-current={targetLocale === locale ? "true" : undefined}
      >
        {t.language[targetLocale]}
      </a>
    ))
  }
</nav>
```

- [ ] **Step 4: Add the shared page intro component**

Create `packages/web/src/components/PageIntro.astro`:

```astro
---
interface Props {
  title: string;
  summary?: string;
}

const { title, summary } = Astro.props;
---

<header class="page-intro shell-inner">
  <h1>{title}</h1>
  {summary && <p>{summary}</p>}
</header>
```

- [ ] **Step 5: Add the public layout**

Create `packages/web/src/layouts/PublicLayout.astro`:

```astro
---
import LanguageSwitcher from "../components/LanguageSwitcher.astro";
import { getTranslations } from "../i18n";
import type { Locale } from "../lib/locale";
import "../styles/global.css";

interface Props {
  locale: Locale;
  title: string;
  currentPath: string;
}

const { locale, title, currentPath } = Astro.props;
const t = getTranslations(locale);
---

<html lang={locale}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="description" content={t.site.description} />
    <title>{title} | {t.site.name}</title>
  </head>
  <body>
    <div class="site-shell">
      <header class="site-header">
        <div class="shell-inner topbar">
          <a class="brand" href={`/${locale}`}>
            <span class="brand-mark" aria-hidden="true"></span>
            <span>{t.site.name}</span>
          </a>
          <nav class="nav-row" aria-label="Primary">
            <a href={`/${locale}`}>{t.nav.home}</a>
            <a href={`/${locale}/login`}>{t.nav.login}</a>
            <a href={`/${locale}/register`}>{t.nav.register}</a>
            <LanguageSwitcher locale={locale} currentPath={currentPath} />
          </nav>
        </div>
      </header>
      <main class="main-content">
        <slot />
      </main>
      <footer class="site-footer">
        <div class="shell-inner footer-content">
          <span>{t.site.name}</span>
          <span>Calella</span>
        </div>
      </footer>
    </div>
  </body>
</html>
```

- [ ] **Step 6: Add the member layout**

Create `packages/web/src/layouts/AppLayout.astro`:

```astro
---
import LanguageSwitcher from "../components/LanguageSwitcher.astro";
import { getTranslations } from "../i18n";
import type { Locale } from "../lib/locale";
import "../styles/global.css";

interface Props {
  locale: Locale;
  title: string;
  currentPath: string;
}

const { locale, title, currentPath } = Astro.props;
const t = getTranslations(locale);
---

<html lang={locale}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="description" content={t.site.description} />
    <title>{title} | {t.site.name}</title>
  </head>
  <body>
    <div class="site-shell">
      <header class="site-header">
        <div class="shell-inner topbar">
          <a class="brand" href={`/${locale}/member`}>
            <span class="brand-mark" aria-hidden="true"></span>
            <span>{t.site.name}</span>
          </a>
          <nav class="nav-row" aria-label="Member">
            <a href={`/${locale}/member`}>{t.nav.member}</a>
            <a href={`/${locale}/member/posts`}>{t.nav.posts}</a>
            <a href={`/${locale}/member/events`}>{t.nav.events}</a>
            <a href={`/${locale}`}>{t.nav.home}</a>
            <LanguageSwitcher locale={locale} currentPath={currentPath} />
          </nav>
        </div>
      </header>
      <main class="main-content">
        <slot />
      </main>
    </div>
  </body>
</html>
```

- [ ] **Step 7: Add the admin layout**

Create `packages/web/src/layouts/AdminLayout.astro`:

```astro
---
import LanguageSwitcher from "../components/LanguageSwitcher.astro";
import { getTranslations } from "../i18n";
import type { Locale } from "../lib/locale";
import "../styles/global.css";

interface Props {
  locale: Locale;
  title: string;
  currentPath: string;
}

const { locale, title, currentPath } = Astro.props;
const t = getTranslations(locale);
---

<html lang={locale}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="description" content={t.site.description} />
    <title>{title} | {t.site.name}</title>
  </head>
  <body>
    <div class="site-shell">
      <header class="site-header">
        <div class="shell-inner topbar">
          <a class="brand" href={`/${locale}/admin`}>
            <span class="brand-mark" aria-hidden="true"></span>
            <span>{t.site.name}</span>
          </a>
          <nav class="nav-row" aria-label="Admin">
            <a href={`/${locale}/admin`}>{t.nav.admin}</a>
            <a href={`/${locale}/admin/users`}>{t.nav.users}</a>
            <a href={`/${locale}/admin/posts`}>{t.nav.posts}</a>
            <a href={`/${locale}/admin/events`}>{t.nav.events}</a>
            <a href={`/${locale}`}>{t.nav.home}</a>
            <LanguageSwitcher locale={locale} currentPath={currentPath} />
          </nav>
        </div>
      </header>
      <main class="main-content">
        <slot />
      </main>
    </div>
  </body>
</html>
```

- [ ] **Step 8: Commit the shell UI foundation**

Run:

```bash
git add packages/web/public/images/club-hero.png packages/web/src/styles/global.css packages/web/src/components/LanguageSwitcher.astro packages/web/src/components/PageIntro.astro packages/web/src/layouts/PublicLayout.astro packages/web/src/layouts/AppLayout.astro packages/web/src/layouts/AdminLayout.astro
git commit -m "Add web shell layouts"
```

Expected result: commit succeeds and includes the visual asset, CSS, components, and layouts.

### Task 5: Add Localized Route Shells

**Files:**
- Create: `packages/web/src/pages/index.astro`
- Create: `packages/web/src/pages/[locale]/index.astro`
- Create: `packages/web/src/pages/[locale]/login.astro`
- Create: `packages/web/src/pages/[locale]/register.astro`
- Create: `packages/web/src/pages/[locale]/verify-email.astro`
- Create: `packages/web/src/pages/[locale]/forgot-password.astro`
- Create: `packages/web/src/pages/[locale]/reset-password.astro`
- Create: `packages/web/src/pages/[locale]/member/index.astro`
- Create: `packages/web/src/pages/[locale]/member/posts.astro`
- Create: `packages/web/src/pages/[locale]/member/events.astro`
- Create: `packages/web/src/pages/[locale]/admin/index.astro`
- Create: `packages/web/src/pages/[locale]/admin/users.astro`
- Create: `packages/web/src/pages/[locale]/admin/posts.astro`
- Create: `packages/web/src/pages/[locale]/admin/events.astro`

- [ ] **Step 1: Add the root locale redirect route**

Create `packages/web/src/pages/index.astro`:

```astro
---
import { DEFAULT_LOCALE, readLocaleCookie } from "../lib/locale";

const locale = readLocaleCookie(Astro.cookies) ?? DEFAULT_LOCALE;
return Astro.redirect(`/${locale}`);
---
```

- [ ] **Step 2: Add the localized landing page**

Create `packages/web/src/pages/[locale]/index.astro`:

```astro
---
import PublicLayout from "../../layouts/PublicLayout.astro";
import { getTranslations } from "../../i18n";
import { getLocaleFromParam, writeLocaleCookie } from "../../lib/locale";

const locale = getLocaleFromParam(Astro.params.locale);
if (!locale) {
  return Astro.redirect("/ca");
}

writeLocaleCookie(Astro.cookies, locale);
const t = getTranslations(locale);
---

<PublicLayout locale={locale} title={t.landing.title} currentPath={Astro.url.pathname}>
  <section class="hero">
    <div class="hero-content">
      <h1>{t.landing.title}</h1>
      <p>{t.landing.subtitle}</p>
      <div class="actions">
        <a class="button-link" href={`/${locale}/login`}>{t.landing.primaryAction}</a>
        <a class="button-link secondary" href={`/${locale}/register`}>{t.landing.secondaryAction}</a>
      </div>
    </div>
  </section>
  <section class="section-band">
    <div class="shell-inner section-grid">
      <article class="panel">
        <h2>{t.landing.postsTitle}</h2>
        <p>{t.landing.postsEmpty}</p>
      </article>
      <article class="panel">
        <h2>{t.landing.eventsTitle}</h2>
        <p>{t.landing.eventsEmpty}</p>
      </article>
    </div>
  </section>
</PublicLayout>
```

- [ ] **Step 3: Add the login route shell**

Create `packages/web/src/pages/[locale]/login.astro`:

```astro
---
import PublicLayout from "../../layouts/PublicLayout.astro";
import { getTranslations } from "../../i18n";
import { getLocaleFromParam, writeLocaleCookie } from "../../lib/locale";

const locale = getLocaleFromParam(Astro.params.locale);
if (!locale) {
  return Astro.redirect("/ca");
}

writeLocaleCookie(Astro.cookies, locale);
const t = getTranslations(locale);
---

<PublicLayout locale={locale} title={t.auth.loginTitle} currentPath={Astro.url.pathname}>
  <section class="form-panel">
    <h1>{t.auth.loginTitle}</h1>
    <form class="field-stack" method="post">
      <label>
        {t.auth.username}
        <input name="username" autocomplete="username" />
      </label>
      <label>
        {t.auth.password}
        <input name="password" type="password" autocomplete="current-password" />
      </label>
      <button class="button-link" type="submit">{t.auth.submitLogin}</button>
    </form>
  </section>
</PublicLayout>
```

- [ ] **Step 4: Add the registration route shell**

Create `packages/web/src/pages/[locale]/register.astro`:

```astro
---
import PublicLayout from "../../layouts/PublicLayout.astro";
import { getTranslations } from "../../i18n";
import { getLocaleFromParam, writeLocaleCookie } from "../../lib/locale";

const locale = getLocaleFromParam(Astro.params.locale);
if (!locale) {
  return Astro.redirect("/ca");
}

writeLocaleCookie(Astro.cookies, locale);
const t = getTranslations(locale);
---

<PublicLayout locale={locale} title={t.auth.registerTitle} currentPath={Astro.url.pathname}>
  <section class="form-panel">
    <h1>{t.auth.registerTitle}</h1>
    <form class="field-stack" method="post">
      <label>
        {t.auth.username}
        <input name="username" autocomplete="username" />
      </label>
      <label>
        {t.auth.email}
        <input name="email" type="email" autocomplete="email" />
      </label>
      <label>
        {t.auth.password}
        <input name="password" type="password" autocomplete="new-password" />
      </label>
      <button class="button-link" type="submit">{t.auth.submitRegister}</button>
    </form>
  </section>
</PublicLayout>
```

- [ ] **Step 5: Add the email verification route shell**

Create `packages/web/src/pages/[locale]/verify-email.astro`:

```astro
---
import PublicLayout from "../../layouts/PublicLayout.astro";
import PageIntro from "../../components/PageIntro.astro";
import { getTranslations } from "../../i18n";
import { getLocaleFromParam, writeLocaleCookie } from "../../lib/locale";

const locale = getLocaleFromParam(Astro.params.locale);
if (!locale) {
  return Astro.redirect("/ca");
}

writeLocaleCookie(Astro.cookies, locale);
const t = getTranslations(locale);
---

<PublicLayout locale={locale} title={t.auth.verifyTitle} currentPath={Astro.url.pathname}>
  <PageIntro title={t.auth.verifyTitle} />
</PublicLayout>
```

- [ ] **Step 6: Add the forgot-password route shell**

Create `packages/web/src/pages/[locale]/forgot-password.astro`:

```astro
---
import PublicLayout from "../../layouts/PublicLayout.astro";
import { getTranslations } from "../../i18n";
import { getLocaleFromParam, writeLocaleCookie } from "../../lib/locale";

const locale = getLocaleFromParam(Astro.params.locale);
if (!locale) {
  return Astro.redirect("/ca");
}

writeLocaleCookie(Astro.cookies, locale);
const t = getTranslations(locale);
---

<PublicLayout locale={locale} title={t.auth.forgotTitle} currentPath={Astro.url.pathname}>
  <section class="form-panel">
    <h1>{t.auth.forgotTitle}</h1>
    <form class="field-stack" method="post">
      <label>
        {t.auth.email}
        <input name="email" type="email" autocomplete="email" />
      </label>
      <button class="button-link" type="submit">{t.auth.submitForgot}</button>
    </form>
  </section>
</PublicLayout>
```

- [ ] **Step 7: Add the reset-password route shell**

Create `packages/web/src/pages/[locale]/reset-password.astro`:

```astro
---
import PublicLayout from "../../layouts/PublicLayout.astro";
import { getTranslations } from "../../i18n";
import { getLocaleFromParam, writeLocaleCookie } from "../../lib/locale";

const locale = getLocaleFromParam(Astro.params.locale);
if (!locale) {
  return Astro.redirect("/ca");
}

writeLocaleCookie(Astro.cookies, locale);
const t = getTranslations(locale);
---

<PublicLayout locale={locale} title={t.auth.resetTitle} currentPath={Astro.url.pathname}>
  <section class="form-panel">
    <h1>{t.auth.resetTitle}</h1>
    <form class="field-stack" method="post">
      <label>
        {t.auth.password}
        <input name="password" type="password" autocomplete="new-password" />
      </label>
      <button class="button-link" type="submit">{t.auth.submitReset}</button>
    </form>
  </section>
</PublicLayout>
```

- [ ] **Step 8: Add the member dashboard route shell**

Create `packages/web/src/pages/[locale]/member/index.astro`:

```astro
---
import PageIntro from "../../../components/PageIntro.astro";
import { getTranslations } from "../../../i18n";
import AppLayout from "../../../layouts/AppLayout.astro";
import { getLocaleFromParam, writeLocaleCookie } from "../../../lib/locale";

const locale = getLocaleFromParam(Astro.params.locale);
if (!locale) {
  return Astro.redirect("/ca");
}

writeLocaleCookie(Astro.cookies, locale);
const t = getTranslations(locale);
---

<AppLayout locale={locale} title={t.member.dashboardTitle} currentPath={Astro.url.pathname}>
  <PageIntro title={t.member.dashboardTitle} summary={t.member.dashboardSummary} />
  <div class="shell-inner content-stack">
    <article class="panel">
      <h2>{t.member.postsTitle}</h2>
      <p>{t.member.draftStatus}</p>
    </article>
    <article class="panel">
      <h2>{t.member.eventsTitle}</h2>
      <p>{t.member.draftStatus}</p>
    </article>
  </div>
</AppLayout>
```

- [ ] **Step 9: Add the member posts route shell**

Create `packages/web/src/pages/[locale]/member/posts.astro`:

```astro
---
import PageIntro from "../../../components/PageIntro.astro";
import { getTranslations } from "../../../i18n";
import AppLayout from "../../../layouts/AppLayout.astro";
import { getLocaleFromParam, writeLocaleCookie } from "../../../lib/locale";

const locale = getLocaleFromParam(Astro.params.locale);
if (!locale) {
  return Astro.redirect("/ca");
}

writeLocaleCookie(Astro.cookies, locale);
const t = getTranslations(locale);
---

<AppLayout locale={locale} title={t.member.postsTitle} currentPath={Astro.url.pathname}>
  <PageIntro title={t.member.postsTitle} />
  <div class="shell-inner content-stack">
    <article class="panel">
      <h2>{t.member.draftStatus}</h2>
      <p>{t.member.postsTitle}</p>
    </article>
  </div>
</AppLayout>
```

- [ ] **Step 10: Add the member events route shell**

Create `packages/web/src/pages/[locale]/member/events.astro`:

```astro
---
import PageIntro from "../../../components/PageIntro.astro";
import { getTranslations } from "../../../i18n";
import AppLayout from "../../../layouts/AppLayout.astro";
import { getLocaleFromParam, writeLocaleCookie } from "../../../lib/locale";

const locale = getLocaleFromParam(Astro.params.locale);
if (!locale) {
  return Astro.redirect("/ca");
}

writeLocaleCookie(Astro.cookies, locale);
const t = getTranslations(locale);
---

<AppLayout locale={locale} title={t.member.eventsTitle} currentPath={Astro.url.pathname}>
  <PageIntro title={t.member.eventsTitle} />
  <div class="shell-inner content-stack">
    <article class="panel">
      <h2>{t.member.draftStatus}</h2>
      <p>{t.member.eventsTitle}</p>
    </article>
  </div>
</AppLayout>
```

- [ ] **Step 11: Add the admin dashboard route shell**

Create `packages/web/src/pages/[locale]/admin/index.astro`:

```astro
---
import PageIntro from "../../../components/PageIntro.astro";
import { getTranslations } from "../../../i18n";
import AdminLayout from "../../../layouts/AdminLayout.astro";
import { getLocaleFromParam, writeLocaleCookie } from "../../../lib/locale";

const locale = getLocaleFromParam(Astro.params.locale);
if (!locale) {
  return Astro.redirect("/ca");
}

writeLocaleCookie(Astro.cookies, locale);
const t = getTranslations(locale);
---

<AdminLayout locale={locale} title={t.admin.dashboardTitle} currentPath={Astro.url.pathname}>
  <PageIntro title={t.admin.dashboardTitle} summary={t.admin.dashboardSummary} />
  <div class="shell-inner section-grid">
    <article class="panel">
      <h2>{t.admin.usersTitle}</h2>
    </article>
    <article class="panel">
      <h2>{t.admin.postsTitle}</h2>
    </article>
  </div>
</AdminLayout>
```

- [ ] **Step 12: Add the admin users route shell**

Create `packages/web/src/pages/[locale]/admin/users.astro`:

```astro
---
import PageIntro from "../../../components/PageIntro.astro";
import { getTranslations } from "../../../i18n";
import AdminLayout from "../../../layouts/AdminLayout.astro";
import { getLocaleFromParam, writeLocaleCookie } from "../../../lib/locale";

const locale = getLocaleFromParam(Astro.params.locale);
if (!locale) {
  return Astro.redirect("/ca");
}

writeLocaleCookie(Astro.cookies, locale);
const t = getTranslations(locale);
---

<AdminLayout locale={locale} title={t.admin.usersTitle} currentPath={Astro.url.pathname}>
  <PageIntro title={t.admin.usersTitle} />
</AdminLayout>
```

- [ ] **Step 13: Add the admin posts route shell**

Create `packages/web/src/pages/[locale]/admin/posts.astro`:

```astro
---
import PageIntro from "../../../components/PageIntro.astro";
import { getTranslations } from "../../../i18n";
import AdminLayout from "../../../layouts/AdminLayout.astro";
import { getLocaleFromParam, writeLocaleCookie } from "../../../lib/locale";

const locale = getLocaleFromParam(Astro.params.locale);
if (!locale) {
  return Astro.redirect("/ca");
}

writeLocaleCookie(Astro.cookies, locale);
const t = getTranslations(locale);
---

<AdminLayout locale={locale} title={t.admin.postsTitle} currentPath={Astro.url.pathname}>
  <PageIntro title={t.admin.postsTitle} />
</AdminLayout>
```

- [ ] **Step 14: Add the admin events route shell**

Create `packages/web/src/pages/[locale]/admin/events.astro`:

```astro
---
import PageIntro from "../../../components/PageIntro.astro";
import { getTranslations } from "../../../i18n";
import AdminLayout from "../../../layouts/AdminLayout.astro";
import { getLocaleFromParam, writeLocaleCookie } from "../../../lib/locale";

const locale = getLocaleFromParam(Astro.params.locale);
if (!locale) {
  return Astro.redirect("/ca");
}

writeLocaleCookie(Astro.cookies, locale);
const t = getTranslations(locale);
---

<AdminLayout locale={locale} title={t.admin.eventsTitle} currentPath={Astro.url.pathname}>
  <PageIntro title={t.admin.eventsTitle} />
</AdminLayout>
```

- [ ] **Step 15: Run web tests and build**

Run:

```bash
npm test --workspace packages/web
npm run build --workspace packages/web
```

Expected result:

```txt
web Vitest exits 0 with 8 tests passing
Astro build exits 0
```

- [ ] **Step 16: Commit the localized route shells**

Run:

```bash
git add packages/web/src/pages
git commit -m "Add localized web route shells"
```

Expected result: commit succeeds and includes only the route shell files.

### Task 6: Add SST Web Infrastructure

**Files:**
- Create: `infra/web.ts`
- Modify: `sst.config.ts`
- Modify if generated: `sst-env.d.ts`
- Modify if generated: `packages/core/sst-env.d.ts`
- Modify if generated: `packages/db/sst-env.d.ts`
- Modify if generated: `packages/functions/sst-env.d.ts`
- Modify if generated: `packages/scripts/sst-env.d.ts`
- Modify if generated: `packages/web/sst-env.d.ts`

- [ ] **Step 1: Create the web infra module**

Create `infra/web.ts`:

```ts
import { api, authApi } from "./workers";

export const website = new sst.cloudflare.Astro("Web", {
  path: "packages/web/",
  link: [api, authApi],
});
```

- [ ] **Step 2: Import the web infra from SST config**

Replace `sst.config.ts` with:

```ts
/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: "CCC",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "cloudflare",
      providers: { cloudflare: "6.17.0" },
    };
  },
  async run() {
    const db = await import("./infra/db");
    const workers = await import("./infra/workers");
    const web = await import("./infra/web");
    return {
      DatabaseId: db.database.databaseId,
      AuthApiUrl: workers.authApi.url,
      ApiUrl: workers.api.url,
      WebUrl: web.website.url,
    };
  },
});
```

- [ ] **Step 3: Verify active infra references Web and no AWS resources**

Run:

```bash
grep -R "WebUrl\\|sst.cloudflare.Astro\\|sst.aws\\|MyBucket\\|MyApi" -n sst.config.ts infra
```

Expected result:

```txt
sst.config.ts contains WebUrl.
infra/web.ts contains sst.cloudflare.Astro.
No sst.aws, MyBucket, or MyApi matches are present.
```

- [ ] **Step 4: Verify SST can calculate the Cloudflare diff**

Run:

```bash
npx sst diff --stage dev --print-logs
```

Expected result:

```txt
exit code 0
planned changes include a Cloudflare Astro site named Web
planned changes do not replace or delete Database, Api, or AuthApi
```

- [ ] **Step 5: Review generated SST env file changes**

Run:

```bash
git status --short
```

Expected result: source changes include `sst.config.ts` and `infra/web.ts`. If SST generated resource type updates, they appear as changes to `sst-env.d.ts` and/or `packages/*/sst-env.d.ts`.

- [ ] **Step 6: Commit the Web infrastructure**

Run:

```bash
git add sst.config.ts infra/web.ts sst-env.d.ts packages/*/sst-env.d.ts
git commit -m "Add web Astro infrastructure"
```

Expected result: commit succeeds and includes `sst.config.ts`, `infra/web.ts`, and any SST-generated env type files changed by the diff command.

### Task 7: Deploy And Verify Dev Web

**Files:**
- No source files should change. If `sst deploy` updates generated `sst-env.d.ts` files, commit those generated files with message `Update SST env for web`.

- [ ] **Step 1: Deploy the dev stage**

Run:

```bash
npx sst deploy --stage dev --print-logs
```

Expected result:

```txt
exit code 0
output includes DatabaseId
output includes AuthApiUrl
output includes ApiUrl
output includes WebUrl
Cloudflare creates or updates the Web Astro site
```

- [ ] **Step 2: Verify the deployed landing page**

Run:

```bash
npx sst shell --stage dev -- node --input-type=module -e 'import { Resource } from "sst"; const response = await fetch(`${Resource.Web.url}/ca`); const text = await response.text(); console.log(response.status); console.log(text.includes("Club d&#39;Escacs Calella") || text.includes("Club d&apos;Escacs Calella") || text.includes("Club d\u0027Escacs Calella"));'
```

Expected result:

```txt
200
true
```

- [ ] **Step 3: Run a post-deploy diff**

Run:

```bash
npx sst diff --stage dev --print-logs
```

Expected result:

```txt
exit code 0
no pending Web, Api, AuthApi, or Database changes are reported
output includes the same DatabaseId, AuthApiUrl, ApiUrl, and WebUrl values from deploy
```

- [ ] **Step 4: Verify generated env files are committed if changed**

Run:

```bash
git status --short
```

Expected result: no output. If the only changes are generated `sst-env.d.ts` files, run:

```bash
git add sst-env.d.ts packages/*/sst-env.d.ts
git commit -m "Update SST env for web"
```

Then rerun:

```bash
git status --short
```

Expected result after committing generated files: no output.

### Task 8: Final Verification And Implementation Log

**Files:**
- Modify: `design/implementation/log.md`
- Modify: `design/implementation/roadmap.md`

- [ ] **Step 1: Run final web verification**

Run:

```bash
npm test --workspace packages/web
npm run build --workspace packages/web
```

Expected result:

```txt
web Vitest exits 0 with 8 tests passing
web Astro build exits 0
```

- [ ] **Step 2: Run existing package verification**

From the repo root, run:

```bash
npm test --workspace packages/functions
npm run typecheck --workspace packages/functions
npm test --workspace packages/db
npm run typecheck --workspace packages/db
npx tsc -p packages/core/tsconfig.json --noEmit
npx tsc -p packages/scripts/tsconfig.json --noEmit
```

Then run the core Vitest check from `packages/core`:

```bash
npx sst shell --stage dev -- vitest --run
```

Expected result:

```txt
Functions Vitest exits 0 with 4 tests passing
Functions typecheck exits 0
DB Vitest exits 0 with 2 tests passing
DB typecheck exits 0
core TypeScript exits 0
scripts TypeScript exits 0
core Vitest exits 0 with 1 test passing
```

- [ ] **Step 3: Run final SST verification**

Run:

```bash
npx sst diff --stage dev --print-logs
```

Expected result:

```txt
exit code 0
no pending Web, Api, AuthApi, or Database changes are reported
```

- [ ] **Step 4: Capture implementation commit hashes**

Run:

```bash
git log --oneline -10
```

Expected result: the recent commits include:

```txt
Add web Astro package scaffold
Add web locale helpers
Add web i18n dictionaries
Add web shell layouts
Add localized web route shells
Add web Astro infrastructure
```

If Task 7 created an `Update SST env for web` commit, include that commit hash too.

- [ ] **Step 5: Update the implementation log**

Append a `Completed Slice: 005-web-astro-shell` section to `design/implementation/log.md`.

The section must include:

```txt
slice name
commit hashes from Step 4
files changed
implemented routes: /, /ca, /es, /en, auth shells, member shells, admin shells
implemented cookie behavior: ccc_locale read by / and written by localized pages
deployment command and result
live verification command and result
verification commands from Steps 1, 2, and 3
verification results from Steps 1, 2, and 3
remaining note: real auth, API calls, data loading, Markdown rendering, and CRUD workflows are intentionally not implemented yet.
```

- [ ] **Step 6: Update the roadmap**

Replace the current-slice section in `design/implementation/roadmap.md` with:

~~~md
## Current Slice

```txt
No active implementation slice is planned in detail.
```

The next candidate slice is:

```txt
006-auth-registration-email-verification
```

Goal: implement user registration, bcrypt-compatible hashing, email verification token storage, and Resend integration.

Detailed plan status:

```txt
to be written before implementation
```
~~~

Ensure the future-slices list no longer includes `006-auth-registration-email-verification` as an unplanned future item once it is named as the next candidate.

- [ ] **Step 7: Commit the implementation log and roadmap update**

Run:

```bash
git add design/implementation/log.md design/implementation/roadmap.md
git commit -m "Record web Astro shell slice"
```

Expected result: commit succeeds and changes only `design/implementation/log.md` and `design/implementation/roadmap.md`.
