import type { PublicUser } from "../../lib/browser-api";
import type { Locale } from "../../lib/locale";

export type MemberAdminNavLabels = {
  admin: string;
};

export type MemberAdminNavLink = {
  href: string;
  label: string;
};

export function memberAdminNavLinks(
  user: PublicUser | null,
  locale: Locale,
  labels: MemberAdminNavLabels,
): MemberAdminNavLink[] {
  return user?.role === "admin"
    ? [{ href: `/${locale}/admin`, label: labels.admin }]
    : [];
}
