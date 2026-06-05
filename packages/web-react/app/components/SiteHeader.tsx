import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getCurrentUser, type PublicUser } from "../lib/account-api";
import { logout } from "../lib/auth-api";
import {
  SUPPORTED_LOCALES,
  type Locale,
  type ShellSection,
  localePath,
} from "../lib/locale";
import { siteSessionCopy, visibleSiteNavItems } from "../lib/site-nav";

type SiteHeaderProps = {
  locale: Locale;
  activeSection: ShellSection;
  languagePath: (locale: Locale) => string;
  navigate?: (path: string) => void;
};

export function SiteHeader({
  activeSection,
  languagePath,
  locale,
  navigate,
}: SiteHeaderProps) {
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const sessionCopy = siteSessionCopy(locale);
  const navigateTo =
    navigate ?? ((path: string) => window.location.assign(path));

  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      const result = await getCurrentUser();
      if (!active) {
        return;
      }

      setCurrentUser(result.ok ? result.data.user : null);
    }

    void loadCurrentUser();

    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      setCurrentUser(null);
      setIsLoggingOut(false);
      navigateTo(localePath(locale));
    }
  }

  return (
    <header className="border-b border-stone-200 bg-white/85">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <Link className="text-base font-semibold" to={localePath(locale)}>
          Calella Chess Club
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {visibleSiteNavItems({ currentUser, locale }).map((item) => (
            <Link
              className={`rounded px-3 py-2 font-medium ${
                isActiveNavItem(item.id, item.section, activeSection)
                  ? "bg-emerald-700 text-white"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"
              }`}
              key={item.id}
              to={item.to}
            >
              {item.label}
            </Link>
          ))}
        </div>
        {currentUser ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span
              aria-label={sessionCopy.account}
              className="rounded border border-stone-200 bg-stone-50 px-3 py-2 font-medium text-stone-700"
            >
              {displayUsername(currentUser)}
            </span>
            <button
              className="rounded border border-stone-300 bg-white px-3 py-2 font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-950 disabled:cursor-not-allowed disabled:text-stone-400"
              disabled={isLoggingOut}
              onClick={handleLogout}
              type="button"
            >
              {isLoggingOut ? sessionCopy.loggingOut : sessionCopy.logout}
            </button>
          </div>
        ) : null}
        <div className="flex items-center gap-1 text-sm">
          {SUPPORTED_LOCALES.map((targetLocale) => (
            <Link
              className={`rounded px-2.5 py-1.5 font-medium ${
                targetLocale === locale
                  ? "bg-stone-950 text-white"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"
              }`}
              key={targetLocale}
              to={languagePath(targetLocale)}
            >
              {targetLocale.toUpperCase()}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

export function displayUsername(user: PublicUser) {
  return user.username.trim() || user.email;
}

function isActiveNavItem(
  id: string,
  section: ShellSection,
  activeSection: ShellSection,
) {
  if (id === "home") {
    return activeSection === "public";
  }

  return section === activeSection;
}
