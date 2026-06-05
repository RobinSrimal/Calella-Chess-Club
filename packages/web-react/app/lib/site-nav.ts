import type { PublicUser } from "./account-api";
import {
  type Locale,
  type ShellSection,
  adminHomePath,
  localePath,
  loginPath,
  registerPath,
} from "./locale";

type SiteNavCopy = {
  home: string;
  member: string;
  admin: string;
  login: string;
  register: string;
};

export type SiteNavItemId = "home" | "member" | "admin" | "login" | "register";

export type SiteNavItem = {
  id: SiteNavItemId;
  label: string;
  to: string;
  section: ShellSection;
};

const SITE_NAV_COPY: Record<Locale, SiteNavCopy> = {
  ca: {
    home: "Inici",
    member: "Membres",
    admin: "Admin",
    login: "Entrar",
    register: "Registrar-se",
  },
  es: {
    home: "Inicio",
    member: "Miembros",
    admin: "Admin",
    login: "Iniciar sesión",
    register: "Registrarse",
  },
  en: {
    home: "Home",
    member: "Members",
    admin: "Admin",
    login: "Log in",
    register: "Register",
  },
};

export function visibleSiteNavItems({
  currentUser,
  locale,
}: {
  currentUser: PublicUser | null;
  locale: Locale;
}): SiteNavItem[] {
  const copy = SITE_NAV_COPY[locale];
  const items: SiteNavItem[] = [
    {
      id: "home",
      label: copy.home,
      section: "public",
      to: localePath(locale),
    },
  ];

  if (!currentUser) {
    items.push(
      {
        id: "login",
        label: copy.login,
        section: "public",
        to: loginPath(locale),
      },
      {
        id: "register",
        label: copy.register,
        section: "public",
        to: registerPath(locale),
      },
    );
    return items;
  }

  items.push({
    id: "member",
    label: copy.member,
    section: "member",
    to: localePath(locale, "member"),
  });

  if (currentUser.role === "admin") {
    items.push({
      id: "admin",
      label: copy.admin,
      section: "admin",
      to: adminHomePath(locale),
    });
  }

  return items;
}
