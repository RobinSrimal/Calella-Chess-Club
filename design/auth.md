# Auth Design

## Purpose

The app runs its own username/password auth in a dedicated Cloudflare auth Worker. Auth supports registration, email verification, login, JWT access tokens, opaque refresh tokens, password reset, and account disablement checks.

## Registration

Registration collects:

```txt
username
email
password
```

Username and email are unique. The password is stored as a salted bcrypt-compatible hash, not encrypted and never plaintext. Because Cloudflare Workers do not run normal Node native addons the same way a Node server does, implementation should use a Worker-compatible bcrypt implementation such as `bcryptjs`, unless verification proves another bcrypt package works in the Worker bundle.

Optional server-side peppering can be used through a secret, but the password hash must remain one-way.

## Email Verification

Registration creates an email verification token and sends a verification link through Resend.

Flow:

```txt
register
create user
create email verification token
send verification email
user verifies email
account becomes active
membership_status becomes pending
```

## Account, Membership, And Role

Account state, membership state, and role are separate.

```txt
account_status:
  active
  disabled

membership_status:
  none
  pending
  member
  rejected

role:
  user
  admin
```

After successful registration and email verification, the person is an active user with a pending membership request. If an admin rejects membership, the account remains active but cannot access member content. Rejected users cannot request membership again; only an admin can move them back to pending/member.

## First Admin

The first admin is created by an operational script in `packages/scripts`.

Flow:

```txt
register normally
verify email
run admin promotion script
script sets role = admin
```

There is no public setup route and no automatic first-user-becomes-admin behavior.

## Login

Login accepts the user's credentials and returns auth cookies.

Tokens:

```txt
access token:
  JWT
  2-hour lifetime
  stored in HTTP-only cookie

refresh token:
  opaque random token
  14-day lifetime
  stored in HTTP-only cookie
  token hash stored in D1
```

Cookies:

```txt
ccc_access_token
  Path=/api

ccc_refresh_token
  Path=/auth

HTTP-only
Secure in production
SameSite=Lax
```

The access JWT may include:

```txt
subject/user id
role
membership status
issued-at
expiration
jti
```

The app API Worker receives the access JWT cookie on `/api/*` routes. Sensitive and admin routes re-check current user state in D1. General member routes may rely on the access JWT until it expires.

## Refresh

When the access JWT expires, the website calls the refresh endpoint. The Worker validates the refresh cookie by hashing the token and checking the D1 `refresh_sessions` row. If valid, it issues a new 2-hour access JWT.

Refresh sessions are revoked on:

```txt
logout
password reset
account disablement
admin/security action requiring forced re-login
```

## Password Reset

Password reset uses Resend and short-lived D1 reset tokens.

Flow:

```txt
forgot password
create password reset token
send reset email through Resend
user submits new password
store new bcrypt-compatible hash
revoke all refresh sessions
clear auth cookies
require login again
```

## Login Throttling

The API records failed login attempts by username/email identifier and IP address. Repeated failures are temporarily throttled. Login errors are generic and return stable error codes such as `AUTH_INVALID_CREDENTIALS`.

## Account Disablement

Admins can disable accounts. Disabled accounts cannot log in. Existing refresh sessions for disabled accounts are revoked. Sensitive/admin routes must reject disabled accounts even if an access JWT has not expired yet.

## Error Codes

The API returns stable error codes and avoids localized messages. The website translates errors based on the active locale.

Example:

```json
{
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS"
  }
}
```
