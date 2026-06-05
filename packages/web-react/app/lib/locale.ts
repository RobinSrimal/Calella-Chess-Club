export const SUPPORTED_LOCALES = ["ca", "es", "en"] as const;
export const DEFAULT_LOCALE: Locale = "ca";

export type Locale = (typeof SUPPORTED_LOCALES)[number];
export type ShellSection = "public" | "member" | "admin";

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && SUPPORTED_LOCALES.includes(value as Locale)
  );
}

export function resolveLocale(value: string | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function localeFromPathname(pathname: string): Locale {
  const [, maybeLocale] = pathname.split("/");
  return resolveLocale(maybeLocale);
}

export function localePath(locale: Locale, section: ShellSection = "public") {
  return section === "public" ? `/${locale}` : `/${locale}/${section}`;
}

export function loginPath(locale: Locale) {
  return `/${locale}/login`;
}

export function registerPath(locale: Locale) {
  return `/${locale}/register`;
}

export function verifyEmailPath(locale: Locale, token?: string) {
  const path = `/${locale}/verify-email`;
  if (!token) {
    return path;
  }

  const params = new URLSearchParams({ token });
  return `${path}?${params.toString()}`;
}

export function forgotPasswordPath(locale: Locale) {
  return `/${locale}/forgot-password`;
}

export function resetPasswordPath(locale: Locale) {
  return `/${locale}/reset-password`;
}

export function adminHomePath(locale: Locale) {
  return `/${locale}/admin`;
}

export function adminUsersPath(locale: Locale) {
  return `/${locale}/admin/users`;
}

export function memberPostsPath(locale: Locale) {
  return `/${locale}/member/posts`;
}

export function routeSectionFromPathname(pathname: string): ShellSection {
  const [, maybeLocale, maybeSection] = pathname.split("/");

  if (!isLocale(maybeLocale)) {
    return "public";
  }

  return maybeSection === "member" || maybeSection === "admin"
    ? maybeSection
    : "public";
}
