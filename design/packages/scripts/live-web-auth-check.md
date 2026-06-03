# Script: live-web-auth-check

## Purpose

`packages/scripts/src/live-web-auth-check.ts` verifies the deployed Web-origin auth path in the dev stage.

It creates a temporary verified member user in D1, logs in through the Web worker `/auth/login` proxy, calls Web-origin `/api/me` with the returned access cookie, and deletes all temporary user/session/login-attempt rows.

## Command

```bash
npx sst shell --stage dev -- npm run live-web-auth-check --workspace packages/scripts
```

## Requirements

```txt
CLOUDFLARE_API_TOKEN
CLOUDFLARE_DEFAULT_ACCOUNT_ID or CLOUDFLARE_ACCOUNT_ID
SST dev secrets, including PasswordPepper
```

## Cleanup

The script runs cleanup in a `finally` block:

```txt
DELETE FROM login_attempts WHERE username_or_email_normalized LIKE live user
DELETE FROM refresh_sessions WHERE user_id = live user id
DELETE FROM users WHERE id = live user id
```

If verification is interrupted externally, check dev D1 for usernames beginning with `liveweb`.
