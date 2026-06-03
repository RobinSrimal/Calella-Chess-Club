# Implementation Log

## 2026-06-02

### Completed Design And Setup Work

```txt
b91e96c Add Cloudflare app design docs
eff8414 Split auth into separate Worker design
1016302 Rename SST template to CCC
230fcae Expand design docs into concrete structure
f5bf1b2 Document admin content public visibility default
07fddc2 Configure Cloudflare provider for SST
73819ea Add Cloudflare D1 resource
c5bde75 Clean up AWS scaffold references
c752dae Add db package scaffold
43f8488 Add initial D1 migration scaffold
77d88d5 Clarify D1 migration sequence
6ca7abb Record db package slice
c16acfe Plan auth Worker health slice
4cabc4d Plan API Worker health slice
```

### Completed Slice: 001-cloudflare-d1-resource

```txt
commit hash
73819ea

files changed
sst.config.ts
infra/db.ts
infra/api.ts
infra/storage.ts
sst-env.d.ts
packages/core/sst-env.d.ts
packages/functions/sst-env.d.ts
packages/scripts/sst-env.d.ts

verification command
grep -R "sst.aws\\|infra/storage\\|infra/api\\|MyBucket\\|MyApi" -n sst.config.ts infra

verification result
No active AWS scaffold references were found in sst.config.ts or infra.

deployment command
npx sst deploy --stage dev --print-logs

deployment result
SST deployed the dev stage and created the Cloudflare D1 resource named Database.
DatabaseId: edf26084-32a2-4d25-b608-ec4ed6a0e763

post-deploy verification command
npx sst diff --stage dev --print-logs

post-deploy verification result
Exit code 0. SST generated the same DatabaseId and reported no pending resource changes.

implementation note
npx sst deploy --stage dev --target Database failed with "Target not found: Database".
The deploy was retried without --target because active SST config contained only the D1 resource.

open follow-up
The generated package examples still need to be replaced by real Worker and script slices.
```

### Completed Cleanup: AWS Scaffold References

```txt
commit hash
c5bde75

files changed
README.md
design/implementation/roadmap.md
package-lock.json
packages/functions/package.json
packages/functions/src/api.ts
packages/scripts/src/example.ts

verification commands
grep -R "sst\\.aws\\|Resource\\.MyBucket\\|MyBucket\\|MyApi\\|aws-lambda\\|@types/aws-lambda\\|aws-monorepo\\|Lambda functions\\|AWS" -n README.md sst.config.ts infra packages package.json package-lock.json design/architecture.md design/infra design/packages design/implementation/roadmap.md
npm ls @types/aws-lambda
npx tsc -p packages/functions/tsconfig.json --noEmit
npx tsc -p packages/scripts/tsconfig.json --noEmit
npx tsc -p packages/core/tsconfig.json --noEmit
npx sst shell --stage dev -- vitest --run

verification result
No app-owned AWS scaffold references remain in README, active infra, packages, package metadata, or current design docs.
@types/aws-lambda is no longer installed.
TypeScript checks exited 0 for core, functions, and scripts.
Vitest exited 0 with 1 test passing.

remaining note
package-lock.json still contains aws-sdk/aws4fetch entries because they are transitive dependencies of SST itself.
Historical implementation docs still mention the removed scaffold as part of the completed migration record.
```

### Completed Slice: 002-db-package-and-empty-migration

```txt
commit hashes
c752dae Add db package scaffold
43f8488 Add initial D1 migration scaffold
77d88d5 Clarify D1 migration sequence

files changed
package-lock.json
packages/db/package.json
packages/db/tsconfig.json
packages/db/src/schema.ts
packages/db/src/schema.test.ts
packages/db/migrations/0001_empty.sql
design/packages/db/migrations.md

verification commands
npm test --workspace packages/db
npm run typecheck --workspace packages/db
grep -E "\\b(CREATE|ALTER|DROP|INSERT)\\b" -n packages/db/migrations/0001_empty.sql
npx tsc -p packages/core/tsconfig.json --noEmit
npx tsc -p packages/functions/tsconfig.json --noEmit
npx tsc -p packages/scripts/tsconfig.json --noEmit
npx sst shell --stage dev -- vitest --run

verification results
DB Vitest exited 0 with 2 tests passing.
DB typecheck exited 0.
The migration grep printed no output and exited 1, confirming no CREATE, ALTER, DROP, or INSERT statements.
Core, functions, and scripts TypeScript checks exited 0.
Core Vitest exited 0 with 1 test passing when run from packages/core through SST shell against the dev stage.

remaining note
The D1 schema tables are still not created. That is intentionally deferred to the first schema migration slice.
```

### Completed Slice: 003-auth-worker-health

```txt
commit hashes
c16acfe Plan auth Worker health slice
876cd87 Add auth Worker health handler
09e4942 Add auth Worker infrastructure
843879e Document auth Worker health route
5d9ac2a Update SST env for auth Worker

files changed
package-lock.json
packages/functions/package.json
packages/functions/src/auth.ts
packages/functions/src/auth.test.ts
infra/workers.ts
sst.config.ts
sst-env.d.ts
packages/db/sst-env.d.ts
design/packages/functions/auth-worker.md
design/packages/functions/routes/auth.md
design/implementation/slices/003-auth-worker-health.md

implemented routes
GET /auth/health

implemented stable error codes
AUTH_ROUTE_NOT_FOUND

deployment command
npx sst deploy --stage dev --print-logs

deployment result
SST deployed the dev stage and created the Cloudflare AuthApi Worker.
AuthApiUrl: https://ccc-dev-authapiscript-bdteakex.robin-srimal.workers.dev
DatabaseId: edf26084-32a2-4d25-b608-ec4ed6a0e763

live verification command
curl -i https://ccc-dev-authapiscript-bdteakex.robin-srimal.workers.dev/auth/health

live verification result
HTTP/2 200
{"service":"auth","status":"ok"}

verification commands
npm test --workspace packages/functions
npm run typecheck --workspace packages/functions
npm test --workspace packages/db
npm run typecheck --workspace packages/db
npx tsc -p packages/core/tsconfig.json --noEmit
npx tsc -p packages/scripts/tsconfig.json --noEmit
npx sst shell --stage dev -- vitest --run
npx sst diff --stage dev --print-logs

verification results
Functions Vitest exited 0 with 2 tests passing.
Functions typecheck exited 0.
DB Vitest exited 0 with 2 tests passing.
DB typecheck exited 0.
Core and scripts TypeScript checks exited 0.
Core Vitest exited 0 with 1 test passing when run from packages/core through SST shell against the dev stage.
SST diff exited 0 and generated the same AuthApiUrl and DatabaseId with no pending resource changes.

remaining note
Registration, login, cookies, JWT signing, refresh sessions, bcrypt hashing, email verification, password reset, and D1 queries are intentionally not implemented yet.
```

### Completed Slice: 004-api-worker-health

```txt
commit hashes
4cabc4d Plan API Worker health slice
6694288 Add API Worker health handler
555af83 Add API Worker infrastructure
fb04977 Document API Worker health route
a547186 Update SST env for API Worker

files changed
packages/functions/src/api.ts
packages/functions/src/api.test.ts
infra/workers.ts
sst.config.ts
sst-env.d.ts
design/packages/functions/api-worker.md
design/packages/functions/routes/api.md
design/implementation/slices/004-api-worker-health.md
design/implementation/roadmap.md

implemented routes
GET /api/health

implemented stable error codes
API_ROUTE_NOT_FOUND

deployment command
npx sst deploy --stage dev --print-logs

deployment result
SST deployed the dev stage and created the Cloudflare Api Worker.
ApiUrl: https://ccc-dev-apiscript-noawkcsx.robin-srimal.workers.dev
AuthApiUrl: https://ccc-dev-authapiscript-bdteakex.robin-srimal.workers.dev
DatabaseId: edf26084-32a2-4d25-b608-ec4ed6a0e763

live verification command
npx sst shell --stage dev -- node --input-type=module -e 'import { Resource } from "sst"; const response = await fetch(`${Resource.Api.url}/api/health`); console.log(response.status); console.log(await response.text());'

live verification result
200
{"service":"api","status":"ok"}

verification commands
npm test --workspace packages/functions
npm run typecheck --workspace packages/functions
npm test --workspace packages/db
npm run typecheck --workspace packages/db
npx tsc -p packages/core/tsconfig.json --noEmit
npx tsc -p packages/scripts/tsconfig.json --noEmit
npx sst shell --stage dev -- vitest --run
npx sst diff --stage dev --print-logs

verification results
Functions Vitest exited 0 with 4 tests passing.
Functions typecheck exited 0.
DB Vitest exited 0 with 2 tests passing.
DB typecheck exited 0.
Core and scripts TypeScript checks exited 0.
Core Vitest exited 0 with 1 test passing when run from packages/core through SST shell against the dev stage.
SST diff exited 0 and generated the same ApiUrl, AuthApiUrl, and DatabaseId with no pending resource changes.

remaining note
JWT parsing, current-user loading, authorization, posts, events, public feeds, admin actions, and D1 queries are intentionally not implemented yet.
```

### Completed Slice: 005-web-astro-shell

```txt
commit hashes
a63edb6 Plan web Astro shell slice
0c8704c Add web Astro package scaffold
355182b Add web locale helpers
8c39628 Add web i18n dictionaries
9d023d6 Add web shell layouts
035af1d Add localized web route shells
ddfb131 Upgrade SST to v4
9864d9c Add web Astro infrastructure
a32d4e4 Update SST env for web
d3b4e5c Add Cloudflare worker types

files changed
package.json
package-lock.json
sst.config.ts
sst-env.d.ts
infra/web.ts
packages/scripts/src/example.ts
packages/web/package.json
packages/web/astro.config.mjs
packages/web/tsconfig.json
packages/web/sst-env.d.ts
packages/web/src/env.d.ts
packages/web/src/lib/locale.ts
packages/web/src/lib/locale.test.ts
packages/web/src/i18n/ca.ts
packages/web/src/i18n/es.ts
packages/web/src/i18n/en.ts
packages/web/src/i18n/index.ts
packages/web/src/i18n/translations.test.ts
packages/web/src/styles/global.css
packages/web/src/components/LanguageSwitcher.astro
packages/web/src/components/PageIntro.astro
packages/web/src/layouts/PublicLayout.astro
packages/web/src/layouts/AppLayout.astro
packages/web/src/layouts/AdminLayout.astro
packages/web/public/images/club-hero.png
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

implemented routes
/
/ca
/es
/en
/{locale}/login
/{locale}/register
/{locale}/verify-email
/{locale}/forgot-password
/{locale}/reset-password
/{locale}/member
/{locale}/member/posts
/{locale}/member/events
/{locale}/admin
/{locale}/admin/users
/{locale}/admin/posts
/{locale}/admin/events

deployment command
npx sst deploy --stage dev --print-logs

deployment result
SST deployed the dev stage and created the Cloudflare Astro Web resource.
WebUrl: https://ccc-dev-webworkerscript.robin-srimal.workers.dev
ApiUrl: https://ccc-dev-apiscript-noawkcsx.robin-srimal.workers.dev
AuthApiUrl: https://ccc-dev-authapiscript-bdteakex.robin-srimal.workers.dev
DatabaseId: edf26084-32a2-4d25-b608-ec4ed6a0e763

live verification command
node --input-type=module -e "const url = 'https://ccc-dev-webworkerscript.robin-srimal.workers.dev/ca'; const response = await fetch(url); const text = await response.text(); console.log(response.status); console.log(text.includes('Calella'));"

live verification result
200
true

local route verification command
node --input-type=module -e "for (const path of ['/ca','/es','/en','/ca/member','/ca/admin']) { const res = await fetch('http://127.0.0.1:4321' + path); const text = await res.text(); console.log(path, res.status, text.includes('<html lang='), text.includes('Calella')); }"

local route verification result
/ca 200 true true
/es 200 true true
/en 200 true true
/ca/member 200 true true
/ca/admin 200 true true

post-deploy diff command
npx sst diff --stage dev --print-logs

post-deploy diff result
SST generated the same WebUrl, ApiUrl, AuthApiUrl, and DatabaseId.
No D1 delete or replacement was reported.
The Astro local builder command and Web Worker script metadata still show preview update noise because the Astro artifact is rebuilt during diff.

remaining note
The web package is a static route shell only. Real login, registration submission, session detection, member data, admin data, posts CRUD, events CRUD, Markdown rendering, and API calls are intentionally not implemented yet.
```

### Completed Slice: 006-auth-registration-email-verification

```txt
commit hashes
1f182c3 Add auth registration migration
3d98cbe Add auth registration helpers
28b798d Add Resend verification email helper
03d4e20 Add auth registration routes
f56467e Fix AuthApi Worker adapter context
772528e Fix Resend fetch binding
566b2eb Clean up registration on email failure
363b008 Update SST env for auth secrets

files changed
package-lock.json
packages/functions/package.json
packages/db/migrations/0002_auth_registration.sql
packages/db/src/schema.ts
packages/db/src/schema.test.ts
packages/functions/src/auth.ts
packages/functions/src/auth.test.ts
packages/functions/src/auth/encoding.ts
packages/functions/src/auth/email.ts
packages/functions/src/auth/email.test.ts
packages/functions/src/auth/password.ts
packages/functions/src/auth/password.test.ts
packages/functions/src/auth/repository.ts
packages/functions/src/auth/tokens.ts
packages/functions/src/auth/tokens.test.ts
packages/functions/src/auth/validation.ts
packages/functions/src/auth/validation.test.ts
infra/secrets.ts
infra/workers.ts
sst-env.d.ts

implemented routes
POST /auth/register
GET /auth/verify-email

implemented stable error codes
AUTH_INVALID_JSON
AUTH_VALIDATION_FAILED
AUTH_USERNAME_TAKEN
AUTH_EMAIL_TAKEN
AUTH_EMAIL_SEND_FAILED
AUTH_VERIFICATION_TOKEN_INVALID
AUTH_VERIFICATION_TOKEN_EXPIRED
AUTH_VERIFICATION_TOKEN_USED

password storage
Passwords are stored as bcrypt hashes after pre-hashing password plus server-side pepper.
Plaintext passwords and encrypted passwords are not stored.

token storage
Email verification tokens are stored as SHA-256 base64url hashes.
Raw verification tokens are only used to build the Resend email link.

D1 migration command
npx wrangler d1 execute ccc-dev-databasedatabase-budbdcht --remote --file packages/db/migrations/0002_auth_registration.sql -y

D1 migration result
Wrangler executed 5 queries successfully.
Remote D1 now has users and email_verification_tokens tables.

deployment command
npx sst deploy --stage dev --print-logs

deployment result
SST deployed AuthApi with PasswordPepper and ResendApiKey linked as secrets.
AuthApiUrl: https://ccc-dev-authapiscript-bdteakex.robin-srimal.workers.dev
DatabaseId: edf26084-32a2-4d25-b608-ec4ed6a0e763

live verification commands
node --input-type=module -e "const base='https://ccc-dev-authapiscript-bdteakex.robin-srimal.workers.dev'; for (const req of [new Request(base + '/auth/verify-email?token=missing'), new Request(base + '/auth/register', { method: 'POST', body: '{' }), new Request(base + '/auth/health')]) { const res = await fetch(req); console.log(req.method, new URL(req.url).pathname, res.status, await res.text()); }"

node --input-type=module -e "const username = 'testuser' + Date.now(); const email = username + '@example.invalid'; const res = await fetch('https://ccc-dev-authapiscript-bdteakex.robin-srimal.workers.dev/auth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, email, password: 'correct horse battery staple', locale: 'en' }) }); console.log(JSON.stringify({ username, email, status: res.status, body: await res.text() }));"

npx wrangler d1 execute ccc-dev-databasedatabase-budbdcht --remote --command "SELECT COUNT(*) AS users_count FROM users WHERE username LIKE 'testuser%'; SELECT COUNT(*) AS tokens_count FROM email_verification_tokens WHERE user_id NOT IN (SELECT id FROM users);" --json

live verification results
GET /auth/verify-email?token=missing returned 400 {"error":{"code":"AUTH_VERIFICATION_TOKEN_INVALID"}}.
POST /auth/register with invalid JSON returned 400 {"error":{"code":"AUTH_INVALID_JSON"}}.
GET /auth/health returned 200 {"service":"auth","status":"ok"}.
POST /auth/register with an example.invalid address returned 502 {"error":{"code":"AUTH_EMAIL_SEND_FAILED"}} and cleanup left zero test users and zero orphan verification tokens.

runtime fixes found during live verification
Cloudflare passes env as the second fetch argument. AuthApi now wraps the default Worker fetch so env is not mistaken for the injected test context.
Cloudflare fetch requires the correct this binding. The Resend helper now calls the injected fetch function unbound.

remaining note
A successful live registration with email delivery still needs a verified Resend sender/recipient configuration. Current dev EMAIL_FROM is Calella Chess Club <onboarding@resend.dev>.
Login, access JWTs, refresh sessions, logout, /api/me, admin membership approval, password reset, posts, and events are intentionally not implemented yet.
```

### Current State

```txt
SST Cloudflare provider is configured and Cloudflare is the SST home provider.
Cloudflare credentials are expected in the repo-root .env file.
The dev stage has one Cloudflare D1 resource named Database.
The dev stage has one Cloudflare Worker resource named AuthApi.
The dev stage has one Cloudflare Worker resource named Api.
The dev stage has one Cloudflare Astro resource named Web.
AuthApiUrl is https://ccc-dev-authapiscript-bdteakex.robin-srimal.workers.dev.
ApiUrl is https://ccc-dev-apiscript-noawkcsx.robin-srimal.workers.dev.
WebUrl is https://ccc-dev-webworkerscript.robin-srimal.workers.dev.
packages/db now owns migration metadata and a comment-only 0001_empty.sql scaffold migration.
packages/db now owns an applied auth registration migration for users and email_verification_tokens.
packages/functions now owns an Auth Worker with GET /auth/health, POST /auth/register, and GET /auth/verify-email.
packages/functions now owns an App API Worker with GET /api/health and stable API_ROUTE_NOT_FOUND handling.
packages/web now owns the Astro shell, localized routes, layout components, i18n dictionaries, and generated hero image.
Design docs mirror intended infra, package, route, page, and table structure.
No AWS resources are active in SST infra.
No app-owned AWS scaffold references remain in active source or package metadata.
```

### Next Slice

```txt
007-login-refresh-logout-me
```

The next slice candidate should implement login, access JWT cookies, refresh cookies, logout, and /api/me.
