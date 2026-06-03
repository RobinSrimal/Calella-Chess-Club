import type { PublicUser } from "../../lib/browser-api";
import type { Locale } from "../../lib/locale";

export type PublicAuthNavLabels = {
  login: string;
  register: string;
  member: string;
  admin: string;
};

export type PublicAuthNavLink = {
  href: string;
  label: string;
};

export function publicAuthNavLinks(
  user: PublicUser | null,
  locale: Locale,
  labels: PublicAuthNavLabels,
): PublicAuthNavLink[] {
  if (!user) {
    return [
      { href: `/${locale}/login`, label: labels.login },
      { href: `/${locale}/register`, label: labels.register },
    ];
  }

  if (user.role === "admin") {
    return [{ href: `/${locale}/admin`, label: labels.admin }];
  }

  return [{ href: `/${locale}/member`, label: labels.member }];
}
