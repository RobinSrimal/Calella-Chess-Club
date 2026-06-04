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

export function localePath(locale: Locale, section: ShellSection = "public") {
  return section === "public" ? `/${locale}` : `/${locale}/${section}`;
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
