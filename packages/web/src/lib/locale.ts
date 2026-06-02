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
