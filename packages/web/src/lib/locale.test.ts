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
