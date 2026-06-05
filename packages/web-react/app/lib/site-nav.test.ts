import { describe, expect, test } from "vitest";
import type { PublicUser } from "./account-api";
import { visibleSiteNavItems } from "./site-nav";

describe("site navigation helpers", () => {
  test("shows home, login, and register to logged-out users", () => {
    expect(visibleSiteNavItems({ currentUser: null, locale: "ca" })).toEqual([
      { id: "home", label: "Inici", to: "/ca", section: "public" },
      { id: "login", label: "Entrar", to: "/ca/login", section: "public" },
      {
        id: "register",
        label: "Registrar-se",
        to: "/ca/register",
        section: "public",
      },
    ]);
  });

  test("shows the member link to any logged-in user", () => {
    const user = publicUser({ membershipStatus: "pending" });

    expect(visibleSiteNavItems({ currentUser: user, locale: "en" })).toEqual([
      { id: "home", label: "Home", to: "/en", section: "public" },
      { id: "member", label: "Members", to: "/en/member", section: "member" },
    ]);
  });

  test("shows the admin link only for logged-in admins", () => {
    const admin = publicUser({ role: "admin" });

    expect(visibleSiteNavItems({ currentUser: admin, locale: "es" })).toEqual([
      { id: "home", label: "Inicio", to: "/es", section: "public" },
      { id: "member", label: "Miembros", to: "/es/member", section: "member" },
      { id: "admin", label: "Admin", to: "/es/admin", section: "admin" },
    ]);
  });

  test("keeps localized labels for each supported locale", () => {
    expect(
      visibleSiteNavItems({ currentUser: null, locale: "ca" }).map(
        (item) => item.label,
      ),
    ).toEqual(["Inici", "Entrar", "Registrar-se"]);
    expect(
      visibleSiteNavItems({ currentUser: null, locale: "es" }).map(
        (item) => item.label,
      ),
    ).toEqual(["Inicio", "Iniciar sesión", "Registrarse"]);
    expect(
      visibleSiteNavItems({ currentUser: null, locale: "en" }).map(
        (item) => item.label,
      ),
    ).toEqual(["Home", "Log in", "Register"]);
  });
});

function publicUser(overrides: Partial<PublicUser>): PublicUser {
  return {
    id: "user-1",
    username: "member",
    email: "member@example.com",
    emailVerified: true,
    membershipStatus: "member",
    role: "user",
    ...overrides,
  };
}
