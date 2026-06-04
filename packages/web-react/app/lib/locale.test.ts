import { describe, expect, test } from "vitest";
import {
  DEFAULT_LOCALE,
  adminUsersPath,
  forgotPasswordPath,
  localeFromPathname,
  localePath,
  resetPasswordPath,
  resolveLocale,
  routeSectionFromPathname,
  verifyEmailPath,
} from "./locale";

describe("locale helpers", () => {
  test("uses Catalan when the URL has no locale", () => {
    expect(resolveLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(resolveLocale("")).toBe(DEFAULT_LOCALE);
  });

  test("falls back to Catalan for invalid locale params", () => {
    expect(resolveLocale("fr")).toBe(DEFAULT_LOCALE);
    expect(resolveLocale("admin")).toBe(DEFAULT_LOCALE);
  });

  test("reads a supported locale from the first path segment", () => {
    expect(localeFromPathname("/ca/login")).toBe("ca");
    expect(localeFromPathname("/es/register")).toBe("es");
    expect(localeFromPathname("/en/member")).toBe("en");
    expect(localeFromPathname("/auth/login")).toBe(DEFAULT_LOCALE);
  });

  test("builds localized paths for app sections", () => {
    expect(localePath("ca")).toBe("/ca");
    expect(localePath("es", "member")).toBe("/es/member");
    expect(localePath("en", "admin")).toBe("/en/admin");
  });

  test("builds localized account and admin utility paths", () => {
    expect(verifyEmailPath("ca")).toBe("/ca/verify-email");
    expect(verifyEmailPath("ca", "raw token")).toBe(
      "/ca/verify-email?token=raw+token",
    );
    expect(forgotPasswordPath("es")).toBe("/es/forgot-password");
    expect(resetPasswordPath("en")).toBe("/en/reset-password");
    expect(adminUsersPath("ca")).toBe("/ca/admin/users");
  });

  test("detects the current shell section from the localized pathname", () => {
    expect(routeSectionFromPathname("/ca")).toBe("public");
    expect(routeSectionFromPathname("/es/member")).toBe("member");
    expect(routeSectionFromPathname("/en/admin")).toBe("admin");
    expect(routeSectionFromPathname("/member")).toBe("public");
  });
});
