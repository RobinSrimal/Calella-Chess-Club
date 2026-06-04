import { describe, expect, test } from "vitest";
import {
  DEFAULT_LOCALE,
  localePath,
  resolveLocale,
  routeSectionFromPathname,
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

  test("builds localized paths for app sections", () => {
    expect(localePath("ca")).toBe("/ca");
    expect(localePath("es", "member")).toBe("/es/member");
    expect(localePath("en", "admin")).toBe("/en/admin");
  });

  test("detects the current shell section from the localized pathname", () => {
    expect(routeSectionFromPathname("/ca")).toBe("public");
    expect(routeSectionFromPathname("/es/member")).toBe("member");
    expect(routeSectionFromPathname("/en/admin")).toBe("admin");
    expect(routeSectionFromPathname("/member")).toBe("public");
  });
});
