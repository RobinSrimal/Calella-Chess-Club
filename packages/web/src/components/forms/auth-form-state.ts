import type { Locale } from "../../lib/locale";
import type { PublicUser } from "../../lib/browser-api";

const GENERIC_ERROR_MESSAGE = "Could not complete the request.";

const ENGLISH_ERROR_MESSAGES: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: "Username or password is incorrect.",
  AUTH_EMAIL_NOT_VERIFIED: "Verify your email before logging in.",
  AUTH_ACCOUNT_DISABLED: "This account is disabled.",
  AUTH_USERNAME_TAKEN: "This username is already taken.",
  AUTH_EMAIL_TAKEN: "This email is already registered.",
  AUTH_VALIDATION_FAILED: "Check the form fields.",
  AUTH_EMAIL_SEND_FAILED: "Could not send the verification email.",
  API_AUTH_REQUIRED: "Log in again.",
  API_AUTH_INVALID: "The session is not valid. Log in again.",
  WEB_REQUEST_FAILED: "Could not connect to the server.",
};

export function messageForErrorCode(code: string): string {
  return ENGLISH_ERROR_MESSAGES[code] ?? GENERIC_ERROR_MESSAGE;
}

export function redirectPathForUser(user: PublicUser, locale: Locale): string {
  return user.role === "admin" ? `/${locale}/admin` : `/${locale}/member`;
}
